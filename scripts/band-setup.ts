// One-time BAND setup: registers the four agents, creates the program room,
// adds the agents to it, and writes their credentials into .env.local.
// Needs BAND_USER_API_KEY (BAND, Settings, API Keys). Run: bun run band:setup
// Secrets are written to the file only, never printed.

import { appendFile } from "node:fs/promises";
import { brand } from "@/lib/data";

const API = "https://api.band.ai/api/v1/me";
const ROLES = [
  { role: "STRATEGY", name: "Strategy", description: "Researches the niche and writes the creator brief" },
  { role: "RESEARCH", name: "Research", description: "Finds and scores creators who fit the brief" },
  { role: "SALES", name: "Sales", description: "Drafts outreach to creators and waits for approval" },
  { role: "REVIEW", name: "Review", description: "Scores posted videos and works out payouts" },
];

const key = process.env.BAND_USER_API_KEY;
if (!key) {
  console.error("BAND_USER_API_KEY is not set. Create one in BAND under Settings, API Keys, and add it to .env.local.");
  process.exit(1);
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { "X-API-Key": key!, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}

const lines: string[] = ["", "# BAND, written by scripts/band-setup.ts"];
const agentIds: string[] = [];

const existing = await call<{ data: Array<{ id: string; name: string }> }>("GET", "/agents");

for (const { role, name, description } of ROLES) {
  if (process.env[`BAND_${role}_API_KEY`]) {
    console.log(`${name}: already in .env.local, left alone`);
    agentIds.push(process.env[`BAND_${role}_AGENT_ID`]!);
    continue;
  }
  if (existing.data.some((agent) => agent.name === name)) {
    // BAND shows a key once, so an agent made earlier cannot be recovered here.
    console.log(`${name}: exists in BAND but its key is not in .env.local. Delete it in BAND and run this again.`);
    continue;
  }
  const created = await call<{ data: { agent: { id: string }; credentials: { api_key: string } } }>(
    "POST",
    "/agents/register",
    { agent: { name, description } },
  );
  lines.push(`BAND_${role}_AGENT_ID=${created.data.agent.id}`);
  lines.push(`BAND_${role}_API_KEY=${created.data.credentials.api_key}`);
  agentIds.push(created.data.agent.id);
  console.log(`${name}: registered`);
}

if (!process.env.BAND_ROOM_ID && agentIds.length > 0) {
  const room = await call<{ data: { id: string } }>("POST", "/chats", {
    chat: { title: `${brand.name} creator program` },
  });
  for (const id of agentIds) {
    await call("POST", `/chats/${room.data.id}/participants`, { participant: { participant_id: id } });
  }
  lines.push(`BAND_ROOM_ID=${room.data.id}`);
  console.log(`Room created with ${agentIds.length} agents in it`);
}

if (lines.length > 2) {
  await appendFile(".env.local", `${lines.join("\n")}\n`);
  console.log("Credentials saved to .env.local");
} else {
  console.log("Nothing new to save");
}
