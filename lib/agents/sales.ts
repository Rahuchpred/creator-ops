import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Brand, Brief } from "@/lib/data";

const MODEL = "claude-opus-5-5";

const OUTREACH_SYSTEM = `You draft first-contact messages for a creator program. A brand pays small creators per view to post short videos on TikTok and Instagram Reels, and you are writing to creators who have never heard from this brand. A person on the brand's team reads every draft and decides whether it is sent, so nothing you write goes out on its own.

You are given the brand, its pay terms, the creator brief, and a list of creators. Write one message per creator. Each creator gets a few of these a week and most are pasted templates, which is why they get ignored. Yours has to read as written to that one person, and the only honest way to do that is to work from what you were actually told about them.

All you know about a creator is their niche, their platform, their numbers and, sometimes, a note on what they post. Open with something true drawn from the niche and the note, and connect it to why this product belongs in their videos. Do not go past what you were given. No named videos, no quotes, no claims about how long you have followed them or how much you love their work. You have not watched anything, and a creator who spots one made-up detail stops trusting the rest of the message, including the pay. When there is no note, a plain line about the niche is enough. Leave their follower and view counts out of the message, since quoting stats back at someone reads as scraping.

State the offer in numbers, because vague money is the main reason these messages look like scams: the rate per 1,000 views, the most a single post can earn, and the minimum views a post needs before it pays. Use the figures exactly as given and do not estimate what this creator would earn, since that would be a promise nobody has approved. Say in one sentence what the video is, taken from the brief, so they can picture making it.

Say plainly that this is a paid partnership and that every post has to be labelled as one, with the platform's paid partnership label or #ad. Creators who learn about disclosure after agreeing feel misled, and the brand is the one on the hook for an unlabelled post.

End with one ask that is easy to answer, such as replying to get the full brief. One ask, not a list of options.

Keep it short enough to read on a phone without scrolling much: roughly 90 to 130 words, short paragraphs, plain text with no markdown, no bullet lists and no emoji. Start with their first name. Sign off as the brand's creator team. Write the way a sharp program manager would talk to a creator they respect: direct, calm, specific. Hype words, exclamation marks and urgency make a real offer sound like a fake one, so leave them out. Follow the brand's rules in what you promise about the product.

For each draft, "handle" is the creator's handle copied exactly as given. "subject" is a short plain line that says what the message is, with the brand's name in it. "why" is one sentence for the person approving the draft on why this creator fits the brief, and it can use the numbers. Return exactly one draft per creator, in the order given.`;

const DraftsSchema = z.object({
  drafts: z
    .array(
      z.object({
        handle: z.string().describe("The creator's handle, copied exactly as given"),
        subject: z.string().describe("A short plain subject line that names the brand"),
        message: z.string().describe("The message to the creator, plain text"),
        why: z.string().describe("One sentence for the approver on why this creator fits"),
      }),
    )
    .describe("One draft per creator, in the order given"),
});

export type Prospect = {
  handle: string;
  name: string;
  platform: "TikTok" | "Instagram";
  niche: string;
  followers: number;
  averageViews: number;
  // An optional line on what the creator posts. The only detail a message may lean on.
  note?: string;
};

export type OutreachDraft = {
  handle: string;
  subject: string;
  message: string;
  why: string;
};

// Money is written out the way it should appear in the message, so the model
// copies "$1.20" and never has to tidy up "$1.2" itself.
function dollars(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function describeOffer(brand: Brand, brief: Brief) {
  return [
    `Brand: ${brand.name}`,
    `Product: ${brand.product}`,
    `Audience: ${brand.audience}`,
    `Rate: ${dollars(brand.ratePerThousandViews)} per 1,000 views`,
    `Cap: up to ${dollars(brand.payoutCapPerPost)} a post`,
    `Minimum: a post pays once it passes ${brand.minimumViews.toLocaleString("en-US")} views`,
    "Rules every post follows:",
    ...brand.rules.map((rule) => `- ${rule}`),
    "",
    `Brief goal: ${brief.goal}`,
    `Brief angle: ${brief.angle}`,
    "Every post includes:",
    ...brief.mustInclude.map((item) => `- ${item}`),
    "Every post avoids:",
    ...brief.avoid.map((item) => `- ${item}`),
  ].join("\n");
}

function describeProspect(prospect: Prospect) {
  return [
    `Handle: ${prospect.handle}`,
    `Name: ${prospect.name}`,
    `Platform: ${prospect.platform}`,
    `Niche: ${prospect.niche}`,
    `Followers: ${prospect.followers.toLocaleString("en-US")}`,
    `Average views: ${prospect.averageViews.toLocaleString("en-US")}`,
    `Note: ${prospect.note?.trim() || "none"}`,
  ].join("\n");
}

export async function draftOutreach(
  brand: Brand,
  brief: Brief,
  prospects: Prospect[],
  onStep: (label: string) => void,
): Promise<OutreachDraft[]> {
  if (prospects.length === 0) return [];

  const handles = new Set(prospects.map((prospect) => prospect.handle));
  if (handles.size !== prospects.length) {
    throw new Error("Two creators in the list share a handle. Remove the duplicate and run it again.");
  }

  const client = new Anthropic();
  const count = prospects.length === 1 ? "1 creator" : `${prospects.length} creators`;

  onStep(`Drafting outreach for ${count}`);
  const written = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: OUTREACH_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${describeOffer(brand, brief)}\n\nCreators:\n\n${prospects.map(describeProspect).join("\n\n")}`,
      },
    ],
    output_config: { format: zodOutputFormat(DraftsSchema) },
  });

  if (written.stop_reason === "refusal") {
    throw new Error("The model declined to draft the outreach. Check the brand and the creator notes for anything unusual.");
  }
  const result = written.parsed_output;
  if (!result) {
    throw new Error("The drafts came back in a shape that could not be read. Run it again.");
  }

  // A draft is only trusted when it maps back to a creator that was asked for.
  onStep("Checking every creator got one draft");
  const byHandle = new Map<string, OutreachDraft>();
  for (const draft of result.drafts) {
    if (!handles.has(draft.handle)) {
      throw new Error(`A draft came back for ${draft.handle}, who is not in the list. Run it again.`);
    }
    if (byHandle.has(draft.handle)) {
      throw new Error(`More than one draft came back for ${draft.handle}. Run it again.`);
    }
    byHandle.set(draft.handle, draft);
  }

  // Returned in the order the creators were given, whatever order the model used.
  const drafts = prospects.map((prospect) => {
    const draft = byHandle.get(prospect.handle);
    if (!draft) {
      throw new Error(`No draft came back for ${prospect.handle}. Run it again.`);
    }
    return draft;
  });

  onStep(drafts.length === 1 ? "1 draft ready for approval" : `${drafts.length} drafts ready for approval`);
  return drafts;
}
