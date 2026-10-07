import { connection } from "next/server";
import {
  brand as sampleBrand,
  creators as sampleCreators,
  posts as samplePosts,
  type Brand,
  type Brief,
  type Creator,
  type Post,
} from "@/lib/data";
import {
  currentBrief,
  readActivity,
  readOutreach,
  readPayoutApprovals,
  readPosts,
  readProgram,
  readRoster,
  type Handoff,
  type Outreach,
  type PayoutApproval,
} from "@/lib/files";

export { saveBrief, saveOutreach, savePosts, saveRoster } from "@/lib/files";

// Read per request, so a brief an agent just wrote shows up on refresh.
// Nothing when a person has set up a program and no brief is written yet.
export async function getBrief(): Promise<Brief | null> {
  await connection();
  return currentBrief();
}

// The program the agents work for, and whether it is still the sample one.
export async function getProgram(): Promise<{ brand: Brand; sample: boolean }> {
  await connection();
  const saved = await readProgram();
  return { brand: saved ?? sampleBrand, sample: !saved };
}

// Sample rows belong to the sample program only.
const sampleRows = async () => !(await readProgram());

// The roster the Research agent built, or the sample one before its first run.
export async function getRoster(): Promise<{ creators: Creator[]; sample: boolean }> {
  await connection();
  const saved = await readRoster();
  if (saved) return { creators: saved, sample: false };
  return (await sampleRows()) ? { creators: sampleCreators, sample: true } : { creators: [], sample: false };
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
  if (saved) return { posts: saved, sample: false };
  return (await sampleRows()) ? { posts: samplePosts, sample: true } : { posts: [], sample: false };
}

// The payouts a person has approved, by post and amount.
export async function getPayoutApprovals(): Promise<PayoutApproval[]> {
  await connection();
  return readPayoutApprovals();
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
