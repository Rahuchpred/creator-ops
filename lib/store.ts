import { connection } from "next/server";
import { brief as sampleBrief, type Brief } from "@/lib/data";
import { readActivity, readBrief, type Handoff } from "@/lib/files";

export { saveBrief } from "@/lib/files";

// Read per request, so a brief an agent just wrote shows up on refresh.
export async function getBrief(): Promise<Brief> {
  await connection();
  return (await readBrief()) ?? sampleBrief;
}

export async function getActivity(): Promise<Handoff[]> {
  await connection();
  return readActivity();
}

// Names of the keys the Strategy agent still needs. Never the values.
// On RocketRide the pipeline searches through Querit only, so Glasser is not
// needed there.
export function missingStrategyKeys(): string[] {
  const needed = process.env.ROCKETRIDE_URI
    ? ["QUERIT_API_KEY"]
    : ["QUERIT_API_KEY", "GLASSER_API_KEY"];
  const missing: string[] = needed.filter((name) => !process.env[name]);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    missing.push("ANTHROPIC_API_KEY");
  }
  return missing;
}
