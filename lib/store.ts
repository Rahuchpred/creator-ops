import { connection } from "next/server";
import {
  brief as sampleBrief,
  creators as sampleCreators,
  posts as samplePosts,
  type Brief,
  type Creator,
  type Post,
} from "@/lib/data";
import {
  readActivity,
  readBrief,
  readOutreach,
  readPosts,
  readRoster,
  type Handoff,
  type Outreach,
} from "@/lib/files";

export { saveBrief, saveOutreach, savePosts, saveRoster } from "@/lib/files";

// Read per request, so a brief an agent just wrote shows up on refresh.
export async function getBrief(): Promise<Brief> {
  await connection();
  return (await readBrief()) ?? sampleBrief;
}

// The roster the Research agent built, or the sample one before its first run.
export async function getRoster(): Promise<{ creators: Creator[]; sample: boolean }> {
  await connection();
  const saved = await readRoster();
  return saved ? { creators: saved, sample: false } : { creators: sampleCreators, sample: true };
}

// The drafts the Sales agent wrote, or none before its first run.
export async function getOutreach(): Promise<Outreach[]> {
  await connection();
  return (await readOutreach()) ?? [];
}

// The posts the Review agent reviewed, or the sample ones before its first run.
export async function getPosts(): Promise<{ posts: Post[]; sample: boolean }> {
  await connection();
  const saved = await readPosts();
  return saved ? { posts: saved, sample: false } : { posts: samplePosts, sample: true };
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

// The Research agent pulls creator data through Glasser only.
export function missingResearchKeys(): string[] {
  const missing: string[] = ["GLASSER_API_KEY"].filter((name) => !process.env[name]);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    missing.push("ANTHROPIC_API_KEY");
  }
  return missing;
}

// The Sales agent only writes, so the model key is all it needs.
export function missingSalesKeys(): string[] {
  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    missing.push("ANTHROPIC_API_KEY");
  }
  return missing;
}

// The Review agent pulls each creator's posts through Glasser and scores
// them with the model.
export function missingReviewKeys(): string[] {
  const missing: string[] = ["GLASSER_API_KEY"].filter((name) => !process.env[name]);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    missing.push("ANTHROPIC_API_KEY");
  }
  return missing;
}
