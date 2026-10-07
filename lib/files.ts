import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OutreachDraft } from "@/lib/agents/sales";
import {
  brand as sampleBrand,
  brief as sampleBrief,
  type Brand,
  type Brief,
  type Creator,
  type Post,
} from "@/lib/data";
import { handleKey } from "@/lib/review/trust";

// Files on disk stand in for the database until InstaCloud is connected.
// Kept free of framework imports so the agent worker can use it too.
// DATA_DIR points at the persistent disk when the app is hosted.
export const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
const DIR = DATA_DIR;
const BRIEF = path.join(DIR, "brief.json");
const ROSTER = path.join(DIR, "roster.json");
const OUTREACH = path.join(DIR, "outreach.json");
const POSTS = path.join(DIR, "posts.json");
const ACTIVITY = path.join(DIR, "activity.json");
const PROGRAM = path.join(DIR, "program.json");
const PAYOUTS = path.join(DIR, "payouts.json");
const BANS = path.join(DIR, "bans.json");

// A drafted message to one creator. Nothing is sent until a person approves it.
export type Outreach = OutreachDraft & {
  status: "Awaiting approval" | "Approved";
  draftedAt: string;
};

// A person's sign-off on what one post earns. It holds for that amount only,
// so a post whose payout changes later waits for approval again.
export type PayoutApproval = {
  postId: string;
  amount: number;
  approvedAt: string;
};

// A creator a person banned from the program, for example for bought views.
// Handles are saved lowercase and without the @.
export type Ban = {
  handle: string;
  bannedAt: string;
};

export type Handoff = {
  at: string;
  from: string;
  to: string;
  note: string;
};

async function read<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function write(file: string, value: unknown) {
  await mkdir(DIR, { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}

export const readProgram = () => read<Brand>(PROGRAM);

// The program the agents work for: the one a person set up, or the sample
// one before that.
export const currentBrand = async () => (await readProgram()) ?? sampleBrand;

// Saves the program. Results written for a different brand are moved aside
// into .data/archive, not deleted, so the screens start clean. Returns
// whether anything was moved.
export async function saveProgram(brand: Brand): Promise<boolean> {
  const before = await currentBrand();
  let moved = false;
  if (before.name !== brand.name) {
    const archive = path.join(DIR, "archive", new Date().toISOString().replace(/[:.]/g, "-"));
    for (const file of [BRIEF, ROSTER, OUTREACH, POSTS, ACTIVITY, PAYOUTS, BANS]) {
      try {
        await mkdir(archive, { recursive: true });
        await rename(file, path.join(archive, path.basename(file)));
        moved = true;
      } catch {
        // Nothing saved for that screen yet.
      }
    }
  }
  await write(PROGRAM, brand);
  return moved;
}

export const readBrief = () => read<Brief>(BRIEF);

// The brief to show: the saved one, or the sample one while the program is
// still the sample. A program a person set up has no brief until the
// Strategy agent writes it.
export async function currentBrief(): Promise<Brief | null> {
  return (await readBrief()) ?? ((await readProgram()) ? null : sampleBrief);
}

// The brief the other agents work from. They cannot start without one.
export async function briefForWork(): Promise<Brief> {
  const brief = await currentBrief();
  if (!brief) {
    throw new Error("There is no brief for this program yet. Run the Strategy agent first.");
  }
  return brief;
}
export const saveBrief = (brief: Brief) => write(BRIEF, brief);

export const readRoster = () => read<Creator[]>(ROSTER);
export const saveRoster = (roster: Creator[]) => write(ROSTER, roster);

// Statuses a person or an approval gave a creator. A new Research run never
// takes them back.
const IN_PROGRESS: Creator["status"][] = ["Contacted", "Onboarded", "Declined"];

// Saves a roster the Research agent just built without losing progress. A
// creator already contacted, onboarded or declined keeps that status, matched
// by handle, and stays on the roster even when the new run did not find them.
// Returns the roster as saved.
export async function saveFoundRoster(found: Creator[]): Promise<Creator[]> {
  const kept = ((await readRoster()) ?? []).filter((creator) =>
    IN_PROGRESS.includes(creator.status),
  );
  const status = new Map(kept.map((creator) => [creator.handle, creator.status]));
  const handles = new Set(found.map((creator) => creator.handle));
  const roster = [
    ...found.map((creator) => ({ ...creator, status: status.get(creator.handle) ?? creator.status })),
    ...kept.filter((creator) => !handles.has(creator.handle)),
  ];
  await saveRoster(roster);
  return roster;
}

// Moves a suggested creator to "Contacted" once their outreach draft is
// approved. Any other status is left alone.
export async function markContacted(handle: string) {
  const roster = await readRoster();
  if (!roster?.some((creator) => creator.handle === handle && creator.status === "Suggested")) return;
  await saveRoster(
    roster.map((creator) =>
      creator.handle === handle ? { ...creator, status: "Contacted" as const } : creator,
    ),
  );
}

export const readOutreach = () => read<Outreach[]>(OUTREACH);
export const saveOutreach = (outreach: Outreach[]) => write(OUTREACH, outreach);

export const readPosts = () => read<Post[]>(POSTS);
export const savePosts = (posts: Post[]) => write(POSTS, posts);

export const readPayoutApprovals = async () => (await read<PayoutApproval[]>(PAYOUTS)) ?? [];
export const savePayoutApprovals = (approvals: PayoutApproval[]) => write(PAYOUTS, approvals);

export const readBans = async () => (await read<Ban[]>(BANS)) ?? [];
export const saveBans = (bans: Ban[]) => write(BANS, bans);

// Whether a person has banned this creator from the program.
export async function isBanned(handle: string): Promise<boolean> {
  const key = handleKey(handle);
  return (await readBans()).some((ban) => ban.handle === key);
}

export const readActivity = async () => (await read<Handoff[]>(ACTIVITY)) ?? [];

// One line per handoff between agents, newest first.
export async function logHandoff(handoff: Handoff) {
  await write(ACTIVITY, [handoff, ...(await readActivity())].slice(0, 200));
}

// One line for a run that was started from a button or an assistant, where
// the result goes to a screen and not to the next agent.
export const logRun = (from: string, to: string, note: string) =>
  logHandoff({ at: new Date().toISOString(), from, to, note });
