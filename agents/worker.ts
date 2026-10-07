// The agent worker. It keeps each agent connected to the shared BAND room.
// An agent wakes when a person, or the agent before it in the chain,
// @mentions it. It does its job, then @mentions the next agent in line.
// Run it next to the app with `bun run agents`.

import { Agent, GenericAdapter, type GenericAdapterHandler } from "@band-ai/sdk";
import { findCreators } from "@/lib/agents/research";
import { reviewPosts } from "@/lib/agents/review";
import { runSales } from "@/lib/agents/sales-run";
import { writeBrief } from "@/lib/agents/strategy";
import { brand, brief as sampleBrief } from "@/lib/data";
import { logHandoff, readBrief, saveBrief, savePosts, saveRoster } from "@/lib/files";
import { summarize } from "@/lib/review/checks";

type Role = "strategy" | "research" | "sales" | "review";

// Who each agent hands its finished work to.
const NEXT: Record<Role, Role | null> = {
  strategy: "research",
  research: "sales",
  sales: "review",
  review: null,
};

const label = (role: Role) => role[0].toUpperCase() + role.slice(1);

// The name an agent goes by in the room. Defaults to its role.
const handle = (role: Role) => process.env[`BAND_${role.toUpperCase()}_HANDLE`] ?? label(role);

const credentials = (role: Role) => {
  const agentId = process.env[`BAND_${role.toUpperCase()}_AGENT_ID`];
  const apiKey = process.env[`BAND_${role.toUpperCase()}_API_KEY`];
  return agentId && apiKey ? { agentId, apiKey } : null;
};

const PREVIOUS: Record<Role, Role | null> = {
  strategy: null,
  research: "strategy",
  sales: "research",
  review: "sales",
};

const online = new Set<Role>();
const busy = new Set<Role>();

type Turn = Parameters<GenericAdapterHandler>[0];

// An agent takes work from a person or from the agent just before it, and
// from nobody else. Without this, a report sent back up the chain would start
// the whole chain again, forever.
function takesWorkFrom(role: Role, message: Turn["message"]) {
  if (message.senderType.toLowerCase() === "user") return true;
  const previous = PREVIOUS[role];
  return previous !== null && message.senderName === handle(previous);
}

// The person in the room. Finished work with no next agent goes to them,
// never back to the agent that asked.
async function person(tools: Turn["tools"]) {
  const participants = await tools.getParticipants();
  return participants.find((participant) => participant.type.toLowerCase() === "user")?.name ?? null;
}

const mention = async (tools: Turn["tools"]) => {
  const name = await person(tools);
  return name ? [name] : undefined;
};

// The next agent when it is online, otherwise the person.
async function recipient(role: Role, tools: Turn["tools"]) {
  const next = NEXT[role];
  if (next && online.has(next)) return { to: handle(next), isAgent: true };
  return { to: await person(tools), isAgent: false };
}

const strategy: GenericAdapterHandler = async ({ tools }) => {
  await tools.sendEvent(`Writing a new brief for ${brand.name}`, "thought");
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { brief } = await writeBrief(brand, today, (step) => {
      void tools.sendEvent(step, "thought");
    });
    await saveBrief(brief);

    const { to, isAgent } = await recipient("strategy", tools);
    const note = [
      `The brief for ${brand.name} is ready.`,
      `Goal: ${brief.goal}`,
      `Angle: ${brief.angle}`,
      `Opening lines: ${brief.hooks.join(" / ")}`,
      isAgent
        ? "Find creators who fit this brief and fill the roster."
        : "The Research agent is not online yet, so this comes back to you.",
    ].join("\n");

    await tools.sendMessage(note, to ? [to] : undefined);
    await logHandoff({ at: new Date().toISOString(), from: "Strategy", to: to ?? "the room", note });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    await tools.sendMessage(
      `I could not write the brief. ${reason}`,
      await mention(tools),
    );
  }
};

const research: GenericAdapterHandler = async ({ tools }) => {
  await tools.sendEvent(`Building the roster for ${brand.name}`, "thought");

  try {
    const brief = (await readBrief()) ?? sampleBrief;
    const roster = await findCreators(brand, brief, (step) => {
      void tools.sendEvent(step, "thought");
    });
    await saveRoster(roster);

    const suggested = roster.filter((creator) => creator.status === "Suggested");
    const rejected = roster.length - suggested.length;
    const { to, isAgent } = await recipient("research", tools);
    const note = [
      `The roster for ${brand.name} is ready: ${suggested.length} suggested, ${rejected} rejected.`,
      ...suggested
        .slice(0, 5)
        .map((creator) => `@${creator.handle}, score ${creator.score}: ${creator.reason}`),
      isAgent
        ? "Draft outreach for the suggested creators."
        : "The Sales agent is not online yet, so this comes back to you.",
    ].join("\n");

    await tools.sendMessage(note, to ? [to] : undefined);
    await logHandoff({ at: new Date().toISOString(), from: "Research", to: to ?? "the room", note });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    await tools.sendMessage(
      `I could not build the roster. ${reason}`,
      await mention(tools),
    );
  }
};

// Sales always reports to the person, because they approve the drafts before
// anything else happens.
const sales: GenericAdapterHandler = async ({ tools }) => {
  await tools.sendEvent(`Drafting outreach for ${brand.name}`, "thought");

  try {
    const drafts = await runSales((step) => {
      void tools.sendEvent(step, "thought");
    });

    const to = await person(tools);
    const note = [
      `${drafts.length === 1 ? "1 outreach draft is" : `${drafts.length} outreach drafts are`} ready for ${brand.name}.`,
      ...drafts.slice(0, 2).map((draft) => `@${draft.handle}: ${draft.subject}`),
      "Nothing has been sent. The drafts are waiting for your approval on the Outreach screen.",
    ].join("\n");

    await tools.sendMessage(note, to ? [to] : undefined);
    await logHandoff({ at: new Date().toISOString(), from: "Sales", to: to ?? "the room", note });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    await tools.sendMessage(
      `I could not draft the outreach. ${reason}`,
      await mention(tools),
    );
  }
};

// Review is the end of the chain, so its report goes to the person, who
// decides the flagged posts and approves the payouts.
const review: GenericAdapterHandler = async ({ tools }) => {
  await tools.sendEvent(`Reviewing posts for ${brand.name}`, "thought");

  try {
    const brief = (await readBrief()) ?? sampleBrief;
    const posts = await reviewPosts(brand, brief, (step) => {
      void tools.sendEvent(step, "thought");
    });
    await savePosts(posts);

    const { approved, inReview, rejected, totalPayout, topFlags } = summarize(posts);
    const to = await person(tools);
    const note = [
      `${posts.length === 1 ? "1 post is" : `${posts.length} posts are`} reviewed for ${brand.name}: ${approved} approved, ${inReview} in review, ${rejected} rejected.`,
      `Approved posts earn $${totalPayout.toFixed(2)} in total.`,
      topFlags.length > 0
        ? `Flags to look at: ${topFlags.map(({ flag, posts: count }) => `${flag} on ${count} ${count === 1 ? "post" : "posts"}`).join(", ")}.`
        : "No flags came up.",
      "Nothing has been paid. The reviews are on the Posts screen and the payouts wait for your approval.",
    ].join("\n");

    await tools.sendMessage(note, to ? [to] : undefined);
    await logHandoff({ at: new Date().toISOString(), from: "Review", to: to ?? "the room", note });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    await tools.sendMessage(
      `I could not review the posts. ${reason}`,
      await mention(tools),
    );
  }
};

const handlers: Partial<Record<Role, GenericAdapterHandler>> = {
  strategy,
  research,
  sales,
  review,
};

// Wraps a handler so it only runs for requests it is allowed to take.
const guarded = (role: Role, handler: GenericAdapterHandler): GenericAdapterHandler =>
  async (turn) => {
    if (!takesWorkFrom(role, turn.message)) {
      await turn.tools.sendEvent(
        `Ignored a message from ${turn.message.senderName ?? "an agent"}: not a request for me`,
        "thought",
      );
      // Tells BAND this turn is handled, so staying silent is not an error.
      turn.tools.turn.settle();
      return;
    }
    // BAND can deliver the same request twice, for example after a restart.
    // One run per agent at a time keeps a duplicate from doubling the spend.
    if (busy.has(role)) {
      await turn.tools.sendEvent("Already working on this, ignoring the repeat", "thought");
      turn.tools.turn.settle();
      return;
    }
    busy.add(role);
    try {
      await handler(turn);
    } finally {
      busy.delete(role);
    }
  };

const agents = (Object.keys(handlers) as Role[]).flatMap((role) => {
  const config = credentials(role);
  if (!config) {
    console.log(`${label(role)}: skipped, BAND_${role.toUpperCase()}_AGENT_ID and _API_KEY are not set`);
    return [];
  }
  online.add(role);
  const agent = Agent.create({
    adapter: new GenericAdapter(guarded(role, handlers[role]!)),
    config,
    // The program room is created before the worker starts. Without this the
    // agent only hears rooms it is added to while running.
    agentConfig: { autoSubscribeExistingRooms: true },
  });
  return [{ role, agent }];
});

if (agents.length === 0) {
  console.error("No agents have BAND credentials. Add them to .env.local and start again.");
  process.exit(1);
}

console.log(`Connecting ${agents.map(({ role }) => label(role)).join(", ")} to BAND`);
Promise.all(agents.map(({ agent }) => agent.run())).catch((error) => {
  console.error("The worker stopped", error);
  process.exit(1);
});
