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

// Files on disk stand in for the database until InstaCloud is connected.
// Kept free of framework imports so the agent worker can use it too.
const DIR = path.join(process.cwd(), ".data");
const BRIEF = path.join(DIR, "brief.json");
const ROSTER = path.join(DIR, "roster.json");
const OUTREACH = path.join(DIR, "outreach.json");
const POSTS = path.join(DIR, "posts.json");
const ACTIVITY = path.join(DIR, "activity.json");
const PROGRAM = path.join(DIR, "program.json");

// A drafted message to one creator. Nothing is sent until a person approves it.
export type Outreach = OutreachDraft & {
  status: "Awaiting approval" | "Approved";
  draftedAt: string;
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
    for (const file of [BRIEF, ROSTER, OUTREACH, POSTS, ACTIVITY]) {
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

export const readOutreach = () => read<Outreach[]>(OUTREACH);
export const saveOutreach = (outreach: Outreach[]) => write(OUTREACH, outreach);

export const readPosts = () => read<Post[]>(POSTS);
export const savePosts = (posts: Post[]) => write(POSTS, posts);

export const readActivity = async () => (await read<Handoff[]>(ACTIVITY)) ?? [];

// One line per handoff between agents, newest first.
export async function logHandoff(handoff: Handoff) {
  await write(ACTIVITY, [handoff, ...(await readActivity())].slice(0, 200));
}
