// The agent worker. It keeps each agent connected to the shared BAND room.
// An agent wakes when someone @mentions it, does its job, then @mentions the
// next agent in line. Run it next to the app with `bun run agents`.

import { Agent, GenericAdapter, type GenericAdapterHandler } from "@band-ai/sdk";
import { writeBrief } from "@/lib/agents/strategy";
import { brand } from "@/lib/data";
import { logHandoff, saveBrief } from "@/lib/files";

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

// Hands off to the next agent when it is online, otherwise back to whoever
// asked, so finished work never lands in a room where nobody is listening.
function recipient(role: Role, asker: string | null) {
  const next = NEXT[role];
  if (next && online.has(next)) return handle(next);
  return asker;
}

const online = new Set<Role>();

const strategy: GenericAdapterHandler = async ({ message, tools }) => {
  await tools.sendEvent(`Writing a new brief for ${brand.name}`, "thought");
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { brief } = await writeBrief(brand, today, (step) => {
      void tools.sendEvent(step, "thought");
    });
    await saveBrief(brief);

    const to = recipient("strategy", message.senderName);
    const note = [
      `The brief for ${brand.name} is ready.`,
      `Goal: ${brief.goal}`,
      `Angle: ${brief.angle}`,
      `Opening lines: ${brief.hooks.join(" / ")}`,
      to === message.senderName
        ? "The Research agent is not online yet, so this comes back to you."
        : "Find creators who fit this brief and fill the roster.",
    ].join("\n");

    await tools.sendMessage(note, to ? [to] : undefined);
    await logHandoff({ at: new Date().toISOString(), from: "Strategy", to: to ?? "the room", note });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    await tools.sendMessage(
      `I could not write the brief. ${reason}`,
      message.senderName ? [message.senderName] : undefined,
    );
  }
};

// Only agents that exist get a handler. Research, Sales and Review join this
// table as they are built.
const handlers: Partial<Record<Role, GenericAdapterHandler>> = { strategy };

const agents = (Object.keys(handlers) as Role[]).flatMap((role) => {
  const config = credentials(role);
  if (!config) {
    console.log(`${label(role)}: skipped, BAND_${role.toUpperCase()}_AGENT_ID and _API_KEY are not set`);
    return [];
  }
  online.add(role);
  const agent = Agent.create({
    adapter: new GenericAdapter(handlers[role]!),
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
