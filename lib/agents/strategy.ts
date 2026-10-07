import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Brand, Brief } from "@/lib/data";
import { rocketRideUri, runPipeline } from "./rocketride";
import { researchTools, type Source, type ToolContext } from "./tools";

const MODEL = "claude-opus-5-5";
const PAID_RUNS_PER_BRIEF = 6;

const RESEARCH_SYSTEM = `You are the strategy lead for a creator program. A brand pays small creators per view to post short videos on TikTok and Instagram Reels. Your job in this step is research: find out what is working in this brand's niche right now, so the brief that follows is grounded in real posts and not in general advice.

You have a live web search and a catalog of paid data endpoints. Use the web search for trend write-ups and format breakdowns. Use the data endpoints for hard evidence: top videos for the niche's hashtags, competitor ads in ad libraries, view counts. Inspect an endpoint before you run it, because runs cost money and are capped.

Stop when you can answer three questions with evidence: which video formats are getting views in this niche, which opening lines hold attention, and what the competing apps' creators are doing. Then write up what you found as plain notes. For every claim, name the post, ad or page it came from and include its URL when you have one. Say plainly when you could not find evidence for something. Those notes are handed to the person who writes the brief, who has not seen your tool results.`;

const WRITE_SYSTEM = `You write creator briefs. A brief tells small creators what to make for a brand's paid program. Creators skim it on a phone, so every line has to be concrete enough to act on.

You are given the brand, its rules, and research notes on what is working in its niche. Base the brief on the notes. Every opening line and every reference should trace back to something in the notes. The brand's rules are not negotiable: carry each one into "mustInclude" or "avoid" as appropriate, in plain words.

Write the way a sharp program manager would talk to a creator: short sentences, no marketing language, no hype. Opening lines are the literal first words a creator would say or put on screen. In references, "url" is the source URL from the notes, or an empty string when the notes gave none. Never invent a URL.`;

const BriefSchema = z.object({
  goal: z.string().describe("One sentence: the single action the program wants viewers to take"),
  angle: z.string().describe("Two or three sentences: the idea every video should carry"),
  hooks: z.array(z.string()).describe("Three to five opening lines to try"),
  mustInclude: z.array(z.string()).describe("What every post includes"),
  avoid: z.array(z.string()).describe("What to leave out"),
  references: z
    .array(
      z.object({
        title: z.string().describe("The format or example, in a few words"),
        why: z.string().describe("One sentence on why it is working"),
        url: z.string().describe("Source URL from the notes, or empty"),
      }),
    )
    .describe("Two to four things that are working in this niche right now"),
});

export type StrategyResult = { brief: Brief; sources: Source[] };

function describeBrand(brand: Brand) {
  return [
    `Brand: ${brand.name}`,
    ...(brand.website ? [`Website: ${brand.website}`] : []),
    `Product: ${brand.product}`,
    `Audience: ${brand.audience}`,
    `Pay: $${brand.ratePerThousandViews} per 1,000 views, up to $${brand.payoutCapPerPost} a post`,
    "Rules every post follows:",
    ...brand.rules.map((rule) => `- ${rule}`),
  ].join("\n");
}

function textOf(content: Array<{ type: string; text?: string }>) {
  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("\n")
    .trim();
}

// The pipeline returns the same brief shape plus the pages its researcher read.
const PipelineBriefSchema = BriefSchema.extend({
  sources: z.array(z.object({ title: z.string(), url: z.string(), site: z.string() })),
});

// The strategy pipeline on RocketRide: a strategist agent that delegates
// research to a sub-agent, defined in pipelines/strategy.pipe.
async function writeBriefOnRocketRide(
  brand: Brand,
  today: string,
  onStep: (label: string) => void,
): Promise<StrategyResult> {
  onStep("Starting the strategy pipeline on RocketRide");
  const raw = await runPipeline(
    "strategy.pipe",
    `Today is ${today}.\n\n${describeBrand(brand)}\n\nWrite the creator brief for this brand.`,
    onStep,
  );

  const parsed = PipelineBriefSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("The pipeline's brief came back in a shape that could not be read. Run it again.");
  }
  const { sources, ...draft } = parsed.data;
  const seen = new Set(sources.map((source) => source.url));

  onStep("Brief written by the pipeline");
  return {
    brief: {
      ...draft,
      updatedAt: today,
      writtenBy: "Strategy agent",
      references: draft.references.map((reference) => ({
        ...reference,
        url: seen.has(reference.url) ? reference.url : "",
      })),
      sources,
    },
    sources,
  };
}

export async function writeBrief(
  brand: Brand,
  today: string,
  onStep: (label: string) => void,
): Promise<StrategyResult> {
  if (rocketRideUri()) return writeBriefOnRocketRide(brand, today, onStep);

  const client = new Anthropic();
  const context: ToolContext = {
    onStep,
    sources: new Map(),
    paidRunsLeft: PAID_RUNS_PER_BRIEF,
  };

  onStep("Reading the brand page");
  const research = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    max_iterations: 16,
    system: RESEARCH_SYSTEM,
    tools: researchTools(context),
    messages: [
      {
        role: "user",
        content: `Today is ${today}.\n\n${describeBrand(brand)}\n\nResearch what is working in this niche right now.`,
      },
    ],
  });

  if (research.stop_reason === "refusal") {
    throw new Error("The model declined the research step. Check the brand page for anything unusual.");
  }
  const notes = textOf(research.content);
  if (!notes) {
    throw new Error("The research step ended without notes. Run it again.");
  }

  onStep("Writing the brief");
  const written = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: WRITE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${describeBrand(brand)}\n\nResearch notes:\n\n${notes}`,
      },
    ],
    output_config: { format: zodOutputFormat(BriefSchema) },
  });

  const draft = written.parsed_output;
  if (!draft) {
    throw new Error("The brief came back in a shape that could not be read. Run it again.");
  }

  return {
    brief: {
      ...draft,
      updatedAt: today,
      writtenBy: "Strategy agent",
      // A link the agent never actually opened is dropped, not trusted.
      references: draft.references.map((reference) => ({
        ...reference,
        url: context.sources.has(reference.url) ? reference.url : "",
      })),
      sources: [...context.sources.values()],
    },
    sources: [...context.sources.values()],
  };
}
