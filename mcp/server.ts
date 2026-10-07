// The Creator Ops MCP server. It lets an AI assistant read the program and
// run the four agents over stdio. Start it with `bun run mcp`.
// The env import stays first: it sets the working directory and loads the
// keys before any product code is loaded.

import "./env";
import Anthropic from "@anthropic-ai/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { findCreators } from "@/lib/agents/research";
import { reviewPosts } from "@/lib/agents/review";
import { runSales } from "@/lib/agents/sales-run";
import { writeBrief } from "@/lib/agents/strategy";
import { creators as sampleCreators } from "@/lib/data";
import {
  readActivity,
  briefForWork,
  currentBrand,
  currentBrief,
  readBrief,
  readOutreach,
  readPosts,
  readRoster,
  saveBrief,
  saveOutreach,
  savePosts,
  saveRoster,
} from "@/lib/files";
import { summarize } from "@/lib/review/checks";

type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>;
type Role = "strategy" | "research" | "sales" | "review";

// Every action tool carries this, so an assistant asks before it spends.
const COST =
  "This starts a paid agent run. It takes one to four minutes and spends a few cents of data plus a model call, so ask the person before calling it.";

const json = (value: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value) }],
});

// A failure the assistant can act on: one plain sentence, never a stack trace.
const failure = (message: string): CallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

function explain(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) {
    return "The model key was rejected. Check ANTHROPIC_API_KEY in .env.local, then call this again.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "The model is rate limited right now. Wait a minute and call this again.";
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Could not reach the model. Check the connection and call this again.";
  }
  if (error instanceof Anthropic.APIError) {
    return `The model returned an error (${error.status}). Call this again.`;
  }
  return error instanceof Error ? error.message : "Something went wrong. Call this again.";
}

// Names of the keys each agent still needs, as the app's routes check them.
// Never the values. On RocketRide the Strategy pipeline searches through
// Querit only, so Glasser is not needed there.
function missingKeys(role: Role): string[] {
  const needed: Record<Role, string[]> = {
    strategy: process.env.ROCKETRIDE_URI
      ? ["QUERIT_API_KEY", "ANTHROPIC_API_KEY"]
      : ["QUERIT_API_KEY", "GLASSER_API_KEY", "ANTHROPIC_API_KEY"],
    research: ["GLASSER_API_KEY", "ANTHROPIC_API_KEY"],
    sales: ["ANTHROPIC_API_KEY"],
    review: ["GLASSER_API_KEY", "ANTHROPIC_API_KEY"],
  };
  return needed[role].filter((name) => !process.env[name]);
}

const busy = new Set<Role>();

// Runs one agent. Each step it reports is collected for the result and, when
// the client asked for progress, sent as a progress notification as well.
async function runAgent(
  role: Role,
  extra: Extra,
  work: (step: (label: string) => void) => Promise<Record<string, unknown>>,
): Promise<CallToolResult> {
  const missing = missingKeys(role);
  if (missing.length > 0) {
    return failure(`Add ${missing.join(", ")} to .env.local in the project root, then call this again.`);
  }
  // One run per agent at a time, so a repeated call never doubles the spend.
  if (busy.has(role)) {
    return failure("This agent is already running. Wait for that run to finish, then read its result.");
  }

  const steps: string[] = [];
  const progressToken = extra._meta?.progressToken;
  const step = (label: string) => {
    steps.push(label);
    if (progressToken === undefined) return;
    void extra
      .sendNotification({
        method: "notifications/progress",
        params: { progressToken, progress: steps.length, message: label },
      })
      .catch(() => undefined);
  };

  busy.add(role);
  try {
    return json({ ...(await work(step)), steps });
  } catch (error) {
    console.error(`The ${role} agent failed`, error);
    return failure(explain(error));
  } finally {
    busy.delete(role);
  }
}

const server = new McpServer({ name: "creator-ops", version: "0.1.0" });

const readOnly = { readOnlyHint: true, openWorldHint: false };
const paidRun = { readOnlyHint: false, destructiveHint: false, openWorldHint: true };

server.registerTool(
  "get_program",
  {
    title: "Get the program",
    description:
      "Returns the brand this creator program runs for: its product, audience, monthly budget, pay rules (rate per 1,000 views, payout cap per post, minimum views before a post pays), the follower range it recruits creators from, and the rules every post follows. Free and instant. Start here when you need to know what the program is or how creators are paid.",
    annotations: readOnly,
  },
  async () => json(await currentBrand()),
);

server.registerTool(
  "get_brief",
  {
    title: "Get the brief",
    description:
      "Returns the creator brief: the goal, the angle, opening lines, what every post includes, what to avoid, and reference formats. Free and instant. The `source` field says whether this is the brief the Strategy agent saved or the built-in sample used until write_brief has run. `sourcesRead` is how many pages the agent read while researching it.",
    annotations: readOnly,
  },
  async () => {
    const saved = await readBrief();
    const shown = await currentBrief();
    if (!shown) return json({ source: "none", note: "No brief yet. Run write_brief first." });
    const { sources, ...brief } = shown;
    return json({ source: saved ? "saved" : "sample", ...brief, sourcesRead: sources.length });
  },
);

server.registerTool(
  "get_roster",
  {
    title: "Get the roster",
    description:
      "Returns the creators on the roster, best score first: handle, name, platform, niche, followers, typical views, score, fit, fraud flags, status, the one-sentence reason and the profile URL. Free and instant. Filter by `status` to see, for example, only the Suggested creators that outreach would be drafted for. `source` is \"sample\" when find_creators has not run yet, and sample creators are made up. `total` counts the matches before `limit` is applied.",
    inputSchema: {
      status: z
        .enum(["Suggested", "Contacted", "Onboarded", "Declined", "Rejected"])
        .optional()
        .describe("Only return creators with this status"),
      limit: z.number().int().min(1).max(100).default(20).describe("The most creators to return"),
    },
    annotations: readOnly,
  },
  async ({ status, limit }) => {
    const saved = await readRoster();
    const matches = (saved ?? sampleCreators)
      .filter((creator) => !status || creator.status === status)
      .sort((a, b) => (b.score ?? b.fit) - (a.score ?? a.fit));
    return json({
      source: saved ? "saved" : "sample",
      total: matches.length,
      creators: matches.slice(0, limit).map((creator) => ({
        handle: creator.handle,
        name: creator.name,
        platform: creator.platform,
        niche: creator.niche,
        followers: creator.followers,
        typicalViews: creator.averageViews,
        score: creator.score ?? null,
        fit: creator.fit,
        flags: creator.flags ?? [],
        status: creator.status,
        reason: creator.reason ?? null,
        url: creator.url ?? null,
      })),
    });
  },
);

server.registerTool(
  "get_outreach",
  {
    title: "Get the outreach drafts",
    description:
      "Returns the outreach messages the Sales agent drafted, one per creator: handle, subject, the full message, why the creator fits, when it was drafted, and its status (\"Awaiting approval\" or \"Approved\"). Free and instant. Returns an empty list when draft_outreach has not run yet. Nothing here has been sent to anyone.",
    annotations: readOnly,
  },
  async () => json({ drafts: (await readOutreach()) ?? [] }),
);

server.registerTool(
  "get_posts",
  {
    title: "Get the reviewed posts",
    description:
      "Returns the posts the Review agent has reviewed: id, handle, caption, date, views, status (Approved, In review or Rejected), flags such as \"View spike\" or \"No disclosure\", the brief score out of 100, the feedback sentence for the creator, the payout in dollars and the post URL. Also returns a summary with counts per status and the total payout. Free and instant. Returns an empty list when review_posts has not run yet.",
    inputSchema: {
      status: z
        .enum(["In review", "Approved", "Rejected"])
        .optional()
        .describe("Only return posts with this status"),
      limit: z.number().int().min(1).max(100).default(30).describe("The most posts to return"),
    },
    annotations: readOnly,
  },
  async ({ status, limit }) => {
    const saved = (await readPosts()) ?? [];
    const matches = saved.filter((post) => !status || post.status === status);
    return json({
      summary: summarize(saved),
      total: matches.length,
      posts: matches.slice(0, limit).map((post) => ({
        id: post.id,
        handle: post.handle,
        platform: post.platform,
        caption: post.caption,
        postedAt: post.postedAt,
        views: post.views,
        status: post.status,
        flags: post.flags ?? (post.flag ? [post.flag] : []),
        briefScore: post.briefScore,
        feedback: post.feedback ?? null,
        payout: post.payout ?? 0,
        url: post.url ?? null,
      })),
    });
  },
);

server.registerTool(
  "get_activity",
  {
    title: "Get recent activity",
    description:
      "Returns the most recent handoffs between the agents, newest first: when, from which agent, to whom, and the note that was passed along. Free and instant. Use it to see what the agents have done lately and in what order. Runs started through this server are not logged here, only handoffs made in the team's shared room.",
    inputSchema: {
      limit: z.number().int().min(1).max(50).default(10).describe("The most handoffs to return"),
    },
    annotations: readOnly,
  },
  async ({ limit }) => json({ handoffs: (await readActivity()).slice(0, limit) }),
);

server.registerTool(
  "write_brief",
  {
    title: "Write a new brief",
    description: `Runs the Strategy agent: it researches what is working in the brand's niche right now, then writes a new creator brief and saves it over the current one. ${COST} Returns the new goal, angle and opening lines, how many pages the agent read, and the steps it took. Read the whole brief afterwards with get_brief. The other agents work from the saved brief, so run this first when the brief is stale.`,
    annotations: paidRun,
  },
  async (extra) =>
    runAgent("strategy", extra, async (step) => {
      const today = new Date().toISOString().slice(0, 10);
      const { brief } = await writeBrief(await currentBrand(), today, step);
      await saveBrief(brief);
      return {
        saved: true,
        goal: brief.goal,
        angle: brief.angle,
        hooks: brief.hooks,
        references: brief.references.length,
        sourcesRead: brief.sources.length,
      };
    }),
);

server.registerTool(
  "find_creators",
  {
    title: "Find creators",
    description: `Runs the Research agent: it searches TikTok for creators whose content matches the brief, pulls their real numbers, scores them, and saves the result as the new roster, replacing the current one. ${COST} Returns how many creators were suggested and rejected, the top five suggestions with their score and reason, and the steps the agent took. Read the full roster afterwards with get_roster.`,
    annotations: paidRun,
  },
  async (extra) =>
    runAgent("research", extra, async (step) => {
      const brief = await briefForWork();
      const roster = await findCreators(await currentBrand(), brief, step);
      await saveRoster(roster);

      const suggested = roster
        .filter((creator) => creator.status === "Suggested")
        .sort((a, b) => (b.score ?? b.fit) - (a.score ?? a.fit));
      return {
        saved: true,
        suggested: suggested.length,
        rejected: roster.length - suggested.length,
        top: suggested.slice(0, 5).map((creator) => ({
          handle: creator.handle,
          score: creator.score ?? creator.fit,
          reason: creator.reason ?? null,
        })),
      };
    }),
);

server.registerTool(
  "draft_outreach",
  {
    title: "Draft outreach",
    description: `Runs the Sales agent: it writes one outreach message for each of the top suggested creators on the saved roster, up to eight, and saves the drafts, replacing the current ones. ${COST} It needs a roster, so run find_creators first if there is none. Nothing is sent to any creator: the drafts wait for approval. Returns each draft's handle and subject and the steps the agent took. Read the full messages afterwards with get_outreach.`,
    annotations: paidRun,
  },
  async (extra) =>
    runAgent("sales", extra, async (step) => {
      if (!(await readRoster())) {
        throw new Error("There is no roster yet. Run find_creators first.");
      }
      const drafts = await runSales(step);
      return {
        saved: true,
        drafted: drafts.length,
        drafts: drafts.map((draft) => ({ handle: draft.handle, subject: draft.subject })),
        sent: 0,
      };
    }),
);

server.registerTool(
  "review_posts",
  {
    title: "Review posts",
    description: `Runs the Review agent: it pulls recent posts from the suggested creators on the saved roster, scores each one against the brief, checks views and disclosure for fraud flags, works out payouts, and saves the reviews, replacing the current ones. ${COST} It needs a roster, so run find_creators first if there is none. Nothing is paid: payouts wait for a person's approval. Returns the counts of approved, in review and rejected posts, the total payout, the most serious flags, and the steps the agent took. Read each review afterwards with get_posts.`,
    annotations: paidRun,
  },
  async (extra) =>
    runAgent("review", extra, async (step) => {
      if (!(await readRoster())) {
        throw new Error("There is no roster yet. Run find_creators first.");
      }
      const brief = await briefForWork();
      const posts = await reviewPosts(await currentBrand(), brief, step);
      await savePosts(posts);
      return { saved: true, reviewed: posts.length, ...summarize(posts) };
    }),
);

server.registerTool(
  "approve_outreach",
  {
    title: "Approve an outreach draft",
    description:
      "Marks one creator's outreach draft as Approved and returns it. Free and instant. Approving does not send anything to anyone: it only records that a person signed off on the wording. Use it after the person has read the draft from get_outreach and said yes. Takes the creator's handle, with or without the @.",
    inputSchema: {
      handle: z.string().trim().min(1).describe("The creator's handle, for example jaydenrose888"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ handle: given }) => {
    const handle = given.replace(/^@/, "");
    const outreach = await readOutreach();
    if (!outreach || outreach.length === 0) {
      return failure("There are no outreach drafts yet. Run draft_outreach first.");
    }
    const draft = outreach.find((row) => row.handle === handle);
    if (!draft) {
      return failure(
        `There is no draft for @${handle}. Call get_outreach to see the handles that have one.`,
      );
    }

    const approved = { ...draft, status: "Approved" as const };
    await saveOutreach(outreach.map((row) => (row.handle === draft.handle ? approved : row)));
    return json({ ...approved, sent: false });
  },
);

async function main() {
  await server.connect(new StdioServerTransport());
  console.error("Creator Ops MCP server is ready on stdio");
}

main().catch((error) => {
  console.error("The Creator Ops MCP server stopped", error);
  process.exit(1);
});
