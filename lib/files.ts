import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Brief } from "@/lib/data";

// Files on disk stand in for the database until InstaCloud is connected.
// Kept free of framework imports so the agent worker can use it too.
const DIR = path.join(process.cwd(), ".data");
const BRIEF = path.join(DIR, "brief.json");
const ACTIVITY = path.join(DIR, "activity.json");

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

export const readBrief = () => read<Brief>(BRIEF);
export const saveBrief = (brief: Brief) => write(BRIEF, brief);

export const readActivity = async () => (await read<Handoff[]>(ACTIVITY)) ?? [];

// One line per handoff between agents, newest first.
export async function logHandoff(handoff: Handoff) {
  await write(ACTIVITY, [handoff, ...(await readActivity())].slice(0, 200));
}
