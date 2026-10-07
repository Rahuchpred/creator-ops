import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Brand, Brief, Creator } from "@/lib/data";
import {
  computeMetrics,
  estimatedPayout,
  followerFit,
  overallScore,
  verdictFor,
  type FetchedCreator,
  type Metrics,
} from "@/lib/research/metrics";
import { fetchCreator, searchVideos, type Budget } from "@/lib/research/tiktok";

const MODEL = "claude-opus-5-5";

// One search is one paid call and one analysis is two. This caps a run at
// roughly ten cents of TikTok data.
const SEARCHES = 5;
const ANALYSES = 14;

const SYSTEM = `You are the research lead for a creator program. A brand pays small creators per view to post short videos about its product. You are given the brand and the brief its creators will follow, and your job is to build the roster: real creators whose existing content already looks like what the brief asks for.

How to work. Search TikTok for the kind of videos the brief describes, using the niche's own words and hashtags. Run a few different searches, because one query only shows one corner of a niche. From the results, pick the creators worth a closer look and analyze each one. Analysis fetches their profile and recent posts and returns their real numbers, their fraud signals, their bio and their recent captions.

Who to look for. The program wants small, active creators whose audience is the brand's audience, not big accounts and not brands. A creator with 8,000 followers who posts study videos four times a week is a better pick than a 2 million follower lifestyle account that once mentioned studying. Skip accounts that are companies, apps, meme pages or reposters. Do not spend an analysis on an account that is clearly outside the brand's follower range.

How to judge fit. After analysis, give each creator a fit score from 0 to 100 for how well what they actually post matches the brief: the format, the audience, the tone. Base it on their captions and bio, never on a guess. A creator who builds, works for or regularly promotes a competing product cannot credibly post for this brand, so score them under 30 and say why. A creator whose one matching video was a one-off, with the rest of their feed about something else, is also a poor fit. You judge fit only. Their reach, reliability, fraud risk and final verdict are computed from their numbers and you cannot change them, so do not try to argue a creator past a fraud flag. If the numbers look wrong for a creator you liked, say so in the reason.

When you have analyzed enough creators to fill a roster, or the budget runs out, call submit_roster once with every creator you analyzed, including the ones you would not recommend. A person will read the reason for each, so make it one specific sentence about that creator, not a general remark.`;

type Analyzed = { creator: FetchedCreator; metrics: Metrics };

const describeTask = (brand: Brand, brief: Brief) =>
  [
    `Brand: ${brand.name}`,
    `Product: ${brand.product}`,
    `Audience: ${brand.audience}`,
    `Creator size wanted: ${brand.creatorFollowers.min} to ${brand.creatorFollowers.max} followers`,
    "",
    `Brief goal: ${brief.goal}`,
    `Angle: ${brief.angle}`,
    `Opening lines creators will use: ${brief.hooks.join(" / ")}`,
    `Every post includes: ${brief.mustInclude.join("; ")}`,
    "",
    "Build the roster for this program.",
  ].join("\n");

export async function findCreators(
  brand: Brand,
  brief: Brief,
  onStep: (label: string) => void,
): Promise<Creator[]> {
  const client = new Anthropic();
  const budget: Budget = { callsLeft: SEARCHES + ANALYSES * 2 };
  let searchesLeft = SEARCHES;
  let analysesLeft = ANALYSES;

  // Only handles that a search actually returned can be analyzed, and only
  // analyzed creators can reach the roster.
  const seen = new Set<string>();
  const analyzed = new Map<string, Analyzed>();
  let roster: Creator[] | null = null;

  const search = betaZodTool({
    name: "search_videos",
    description:
      "Search TikTok for videos. Returns up to 30 videos with the creator's handle, the caption, views and likes. Use it to discover creators. Limited to a few calls per run.",
    inputSchema: z.object({
      query: z.string().describe("Search words, or a hashtag without the # when kind is hashtag"),
      kind: z.enum(["keyword", "hashtag"]),
    }),
    run: async ({ query, kind }) => {
      if (searchesLeft <= 0) return "No searches left. Analyze the creators you have found.";
      searchesLeft -= 1;
      onStep(`Searching TikTok: ${kind === "hashtag" ? "#" : ""}${query}`);
      try {
        const videos = await searchVideos(query, kind, budget);
        for (const video of videos) seen.add(video.handle);
        return JSON.stringify({ searchesLeft, videos });
      } catch (error) {
        return `The search failed: ${error instanceof Error ? error.message : "unknown error"}`;
      }
    },
  });

  const analyze = betaZodTool({
    name: "analyze_creator",
    description:
      "Fetch one creator's profile and recent posts and compute their numbers: followers, typical views, engagement, posting pace and fraud signals. Only works for handles a search returned. Limited per run, so pick carefully.",
    inputSchema: z.object({ handle: z.string().describe("The creator's handle without the @") }),
    run: async ({ handle }) => {
      const key = handle.replace(/^@/, "");
      if (!seen.has(key)) return "That handle did not come from a search. Use a handle from the results.";
      if (analyzed.has(key)) return "Already analyzed.";
      if (analysesLeft <= 0) return "No analyses left. Submit the roster now.";
      analysesLeft -= 1;
      onStep(`Checking @${key}`);
      try {
        const creator = await fetchCreator(key, budget);
        const metrics = computeMetrics(creator);
        analyzed.set(key, { creator, metrics });
        return JSON.stringify({
          analysesLeft,
          handle: key,
          name: creator.name,
          bio: creator.bio,
          followers: creator.followers,
          typicalViews: metrics.medianViews,
          engagementRate: Number(metrics.engagementRate.toFixed(4)),
          postsPerWeek: Number(metrics.postsPerWeek.toFixed(1)),
          fraudFlags: metrics.flags,
          recentCaptions: creator.posts.slice(0, 10).map((post) => post.caption.slice(0, 200)),
        });
      } catch (error) {
        return `Could not fetch @${key}: ${error instanceof Error ? error.message : "unknown error"}`;
      }
    },
  });

  const submit = betaZodTool({
    name: "submit_roster",
    description:
      "Submit the roster. Call once, with every creator you analyzed. The final score and verdict are computed from your fit score and their numbers.",
    inputSchema: z.object({
      creators: z.array(
        z.object({
          handle: z.string(),
          fit: z.number().describe("0 to 100: how well their content matches the brief"),
          niche: z.string().describe("What they post, in two to four words"),
          reason: z.string().describe("One specific sentence on why they fit or do not"),
        }),
      ),
    }),
    run: async ({ creators }) => {
      const rows = creators.flatMap((entry): Creator[] => {
        const found = analyzed.get(entry.handle.replace(/^@/, ""));
        if (!found) return [];
        const { creator, metrics } = found;
        const score = overallScore(entry.fit, metrics, followerFit(creator.followers, brand));
        const verdict = verdictFor(score, entry.fit, metrics, creator, brand);
        return [
          {
            handle: creator.handle,
            name: creator.name,
            platform: "TikTok",
            followers: creator.followers,
            averageViews: metrics.medianViews,
            fit: Math.round(Math.max(0, Math.min(100, entry.fit))),
            niche: entry.niche,
            status: verdict === "reject" ? "Rejected" : "Suggested",
            score,
            engagementRate: metrics.engagementRate,
            flags: metrics.flags,
            reason: entry.reason,
            estimatedPayout: estimatedPayout(metrics, brand),
            url: `https://www.tiktok.com/@${creator.handle}`,
          },
        ];
      });
      if (rows.length === 0) return "None of those handles were analyzed. Submit analyzed creators.";
      roster = rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      return `Roster saved with ${rows.length} creators.`;
    },
  });

  onStep("Reading the brief");
  const final = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    max_iterations: 40,
    system: SYSTEM,
    tools: [search, analyze, submit],
    messages: [{ role: "user", content: describeTask(brand, brief) }],
  });

  if (final.stop_reason === "refusal") {
    throw new Error("The model declined the research step. Check the brief for anything unusual.");
  }
  // TypeScript cannot see that the tool callback assigns this.
  const result = roster as Creator[] | null;
  if (!result) {
    throw new Error("The research ended without a roster. Run it again.");
  }
  onStep(
    `Roster built: ${result.filter((row) => row.status === "Suggested").length} suggested, ${result.filter((row) => row.status === "Rejected").length} rejected`,
  );
  return result;
}
