import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Brand, Brief, Post } from "@/lib/data";
import { readPosts, readRoster } from "@/lib/files";
import { saveImage } from "@/lib/media";
import type { FetchedPost } from "@/lib/research/metrics";
import { fetchCreator, type Budget } from "@/lib/research/tiktok";
import { readVideoLink } from "@/lib/review/link";
import { engagementRate, flagsFor, payoutFor, verdictFor } from "@/lib/review/checks";

const MODEL = "claude-opus-5-5";

// One creator is two paid calls, so a run uses eight and the budget leaves a
// little room. That caps a run at a few cents of TikTok data.
const CREATORS = 4;
const POSTS_PER_CREATOR = 4;
const DATA_CALLS = 10;
// The most creators one run refreshes handed-in posts for.
const SUBMITTERS = 8;

const SYSTEM = `You review posts for a creator program. A brand pays small creators per view to post short videos about its product, and every creator works from the same brief. You are given the brand, the brief and a list of posts, and for each post you decide how well it follows the brief and tell the creator what to change.

What you can see. For each post you have its caption and nothing else. You have not watched the video, so you do not know what is on screen, what is said, how it opens or how long it runs. Score what the caption shows and stop there. A caption that describes the product in use is evidence the video is about the product. A caption that says nothing about the product is not evidence the product is missing from the footage, but it is also no evidence that it is there, and a score cannot rest on something you have not seen. When a caption is empty, or only a few words or hashtags, say in the feedback that the caption is too thin to judge the video from and score it low, because nothing in front of you shows the post follows the brief. Do not describe footage, and do not tell a creator their video did or did not show something.

How to score. Give each post a brief score from 0 to 100 for how well what the caption shows matches the brief: the product, the angle, the opening lines, the things every post includes and the things to avoid. A post that is plainly about something else scores under 20, and the feedback should say so directly, since some of these posts were never made for this brand. A post that breaks something on the avoid list, such as a promise the brand does not allow, scores under 50 however well the rest fits. Keep the top of the range for captions that clearly carry the brief's angle.

How to write the feedback. One sentence, written to the creator, about this post. Name the single most useful change and be specific to their caption, the way a coach who read it would be. Creators get all their feedback at once and act on it once, so a general remark that would fit any post wastes their one chance to fix it. Plain words, no hype, no markdown.

What is not your job. Whether the post is marked as a paid partnership, whether its views look real, and what it earns are checked separately from the post's numbers. Leave them out of the score and the feedback, and do not mention views or money.

For each result, "id" is the post's id copied exactly as given. Return exactly one result per post, in the order given.`;

const ReviewsSchema = z.object({
  reviews: z
    .array(
      z.object({
        id: z.string().describe("The post's id, copied exactly as given"),
        briefScore: z.number().describe("0 to 100: how well the caption shows the post follows the brief"),
        feedback: z.string().describe("One specific sentence to the creator on what to change"),
      }),
    )
    .describe("One result per post, in the order given"),
});

type Candidate = {
  id: string;
  handle: string;
  name: string;
  avatarLink?: string;
  post: FetchedPost;
  // The same creator's other fetched posts, which set what is normal for them.
  others: FetchedPost[];
  // Handed in by a person for the program, not picked for a test run.
  submitted?: boolean;
  // The saved row for this post, when it was reviewed before.
  before?: Post;
};

type Judgment = { briefScore: number; feedback: string };

const describeTask = (brand: Brand, brief: Brief) =>
  [
    `Brand: ${brand.name}`,
    `Product: ${brand.product}`,
    `Audience: ${brand.audience}`,
    "Rules every post follows:",
    ...brand.rules.map((rule) => `- ${rule}`),
    "",
    `Brief goal: ${brief.goal}`,
    `Angle: ${brief.angle}`,
    `Opening lines creators use: ${brief.hooks.join(" / ")}`,
    "Every post includes:",
    ...brief.mustInclude.map((item) => `- ${item}`),
    "Every post avoids:",
    ...brief.avoid.map((item) => `- ${item}`),
  ].join("\n");

const describePost = ({ id, handle, post }: Candidate) =>
  [`Id: ${id}`, `Creator: @${handle}`, `Caption: ${post.caption.trim() || "(empty)"}`].join("\n");

const postedOn = (post: FetchedPost) => {
  const time = Date.parse(post.createdAt);
  return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : "";
};

// Newest first. A profile lists pinned posts ahead of recent ones, so the
// order it arrives in cannot be trusted.
const newestFirst = (posts: FetchedPost[]) =>
  [...posts].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));

// Before any post is handed in, the posts under review are the roster
// creators' own recent videos. Nothing here is made up.
async function fetchCandidates(onStep: (label: string) => void): Promise<Candidate[]> {
  const roster = await readRoster();
  if (!roster) {
    throw new Error("There is no roster yet. Run the Research agent first, then review posts.");
  }
  const suggested = roster
    // A creator moves to "Contacted" when their outreach is approved, and
    // their posts still need reviewing.
    .filter((creator) => ["Suggested", "Contacted", "Onboarded"].includes(creator.status))
    .sort((a, b) => (b.score ?? b.fit) - (a.score ?? a.fit))
    .slice(0, CREATORS);
  if (suggested.length === 0) {
    throw new Error(
      "The roster has no creators to review. Run the Research agent again, then review posts.",
    );
  }

  const budget: Budget = { callsLeft: DATA_CALLS };
  const candidates: Candidate[] = [];
  for (const { handle } of suggested) {
    onStep(`Fetching recent posts from @${handle}`);
    try {
      const creator = await fetchCreator(handle, budget);
      const posts = newestFirst(creator.posts);
      posts.slice(0, POSTS_PER_CREATOR).forEach((post, index) => {
        candidates.push({
          id: `${handle}-${index + 1}`,
          handle,
          name: creator.name,
          avatarLink: creator.avatarLink,
          post,
          others: posts.filter((other) => other !== post),
        });
      });
    } catch (error) {
      // One creator failing should not cost the run the others.
      onStep(
        `Could not fetch @${handle}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }
  if (candidates.length === 0) {
    throw new Error("No posts could be fetched for the roster's creators. Run it again.");
  }
  return candidates;
}

async function judge(
  brand: Brand,
  brief: Brief,
  candidates: Candidate[],
  onStep: (label: string) => void,
): Promise<Map<string, Judgment>> {
  const client = new Anthropic();
  const count = candidates.length === 1 ? "1 post" : `${candidates.length} posts`;
  onStep(`Scoring ${count} against the brief`);
  const written = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `${describeTask(brand, brief)}\n\nPosts:\n\n${candidates.map(describePost).join("\n\n")}`,
      },
    ],
    output_config: { format: zodOutputFormat(ReviewsSchema) },
  });

  if (written.stop_reason === "refusal") {
    throw new Error("The model declined to review the posts. Check the brief and the captions for anything unusual.");
  }
  const result = written.parsed_output;
  if (!result) {
    throw new Error("The reviews came back in a shape that could not be read. Run it again.");
  }

  // A review is only trusted when it maps back to a post that was asked about.
  onStep("Checking every post got one review");
  const ids = new Set(candidates.map((candidate) => candidate.id));
  const byId = new Map<string, Judgment>();
  for (const review of result.reviews) {
    if (!ids.has(review.id)) {
      throw new Error(`A review came back for ${review.id}, which is not in the list. Run it again.`);
    }
    if (byId.has(review.id)) {
      throw new Error(`More than one review came back for ${review.id}. Run it again.`);
    }
    byId.set(review.id, review);
  }
  for (const id of ids) {
    if (!byId.has(id)) throw new Error(`No review came back for ${id}. Run it again.`);
  }
  return byId;
}

// Looks up one creator and turns the wanted videos into candidates. Videos
// are matched by id against the creator's recent posts, which also set what
// is normal for them.
async function fetchSubmitted(
  handle: string,
  wanted: { videoId: string; before?: Post }[],
  budget: Budget,
): Promise<{ found: Candidate[]; missing: string[] }> {
  const creator = await fetchCreator(handle, budget);
  const found: Candidate[] = [];
  const missing: string[] = [];
  for (const { videoId, before } of wanted) {
    const post = creator.posts.find((candidate) => candidate.id === videoId);
    if (!post) {
      missing.push(videoId);
      continue;
    }
    found.push({
      id: videoId,
      handle,
      name: creator.name,
      avatarLink: creator.avatarLink,
      post,
      others: creator.posts.filter((other) => other !== post),
      submitted: true,
      before,
    });
  }
  return { found, missing };
}

// Scores the candidates and builds the rows to save. The model's part ends
// with the score and the sentence. Flags, verdict and payout are computed
// from the post's numbers.
async function review(
  brand: Brand,
  brief: Brief,
  candidates: Candidate[],
  onStep: (label: string) => void,
): Promise<Post[]> {
  const judgments = await judge(brand, brief, candidates, onStep);

  onStep("Checking views, disclosure and payouts");
  const scored = candidates.map(({ id, handle, name, post, others, submitted, before }): Post => {
    const { briefScore: raw, feedback } = judgments.get(id)!;
    const briefScore = Math.round(Math.max(0, Math.min(100, raw)));
    const flags = flagsFor(post, others);
    // A person's call on a held post stands. Only the numbers move.
    const decided = before?.decidedBy === "person";
    const status = decided ? before.status : verdictFor(briefScore, flags);
    return {
      id,
      handle,
      name,
      platform: "TikTok",
      caption: post.caption,
      postedAt: postedOn(post),
      views: post.views,
      briefScore,
      flag: flags[0] ?? null,
      flags,
      status,
      feedback: feedback.trim(),
      url: post.url,
      engagementRate: engagementRate(post),
      payout: payoutFor({ status, views: post.views }, brand),
      durationSeconds: post.durationSeconds,
      likes: post.likes,
      comments: post.comments,
      ...(submitted ? { submitted: true } : {}),
      ...(decided ? { decidedBy: "person" as const } : {}),
    };
  });

  // Pictures are saved last and never block a review: a post without a
  // cover still shows with a placeholder.
  onStep("Saving video covers");
  return Promise.all(
    scored.map(async (row, index) => {
      const { post, handle, avatarLink } = candidates[index];
      const [cover, avatar] = await Promise.all([
        saveImage(post.coverLink, `cover:${post.id ?? row.id}`),
        saveImage(avatarLink, `avatar:${handle}`),
      ]);
      return { ...row, cover, avatar };
    }),
  );
}

const summary = (rows: Post[]) => {
  const count = (status: Post["status"]) => rows.filter((row) => row.status === status).length;
  return `${count("Approved")} approved, ${count("In review")} in review, ${count("Rejected")} rejected`;
};

// One Review run. Once posts have been handed in, it reviews those again
// with today's numbers. Before that it tests itself on the roster creators'
// own videos.
export async function reviewPosts(
  brand: Brand,
  brief: Brief,
  onStep: (label: string) => void,
): Promise<Post[]> {
  const submitted = ((await readPosts()) ?? []).filter((post) => post.submitted);
  if (submitted.length === 0) {
    const rows = await review(brand, brief, await fetchCandidates(onStep), onStep);
    onStep(`Review done: ${summary(rows)}`);
    return rows;
  }

  const byHandle = new Map<string, Post[]>();
  for (const post of submitted) {
    byHandle.set(post.handle, [...(byHandle.get(post.handle) ?? []), post]);
  }

  const budget: Budget = { callsLeft: SUBMITTERS * 2 };
  const candidates: Candidate[] = [];
  // Rows that could not be refreshed are kept as they were, never dropped.
  const kept: Post[] = [];
  for (const [handle, posts] of byHandle) {
    if (budget.callsLeft < 2) {
      kept.push(...posts);
      continue;
    }
    onStep(`Fetching today's numbers for @${handle}`);
    try {
      const { found, missing } = await fetchSubmitted(
        handle,
        posts.map((before) => ({ videoId: before.id, before })),
        budget,
      );
      candidates.push(...found);
      kept.push(...posts.filter((post) => missing.includes(post.id)));
    } catch (error) {
      onStep(
        `Could not fetch @${handle}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      kept.push(...posts);
    }
  }

  const rows = candidates.length > 0 ? await review(brand, brief, candidates, onStep) : [];
  const all = [...rows, ...kept];
  onStep(`Review done: ${summary(all)}`);
  return all;
}

// Reviews one video a person handed in by pasting its link, and returns the
// full list of handed-in posts to save. Test rows from before the first real
// post are dropped, since the program now has real ones.
export async function reviewLink(
  brand: Brand,
  brief: Brief,
  link: string,
  onStep: (label: string) => void,
): Promise<{ post: Post; posts: Post[] }> {
  onStep("Reading the link");
  const { handle, videoId } = await readVideoLink(link);

  const saved = ((await readPosts()) ?? []).filter((post) => post.submitted);
  const before = saved.find((post) => post.id === videoId);

  onStep(`Fetching the video and @${handle}'s recent posts`);
  const { found } = await fetchSubmitted(handle, [{ videoId, before }], { callsLeft: 2 });
  if (found.length === 0) {
    throw new Error(
      `That video is not among @${handle}'s recent posts. Check the link, or wait a few minutes if it was just posted.`,
    );
  }

  const [post] = await review(brand, brief, found, onStep);
  onStep(
    post.status === "Approved"
      ? `Approved. It earns $${(post.payout ?? 0).toFixed(2)} so far`
      : `${post.status}. Open it to see why`,
  );
  return { post, posts: [post, ...saved.filter((other) => other.id !== videoId)] };
}
