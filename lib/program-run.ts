// Runs the whole program from one press: Strategy, then Research, then
// Sales, then a first check of the program hashtag when there is one. Kept
// free of framework imports, like the agents it calls.
//
// A real run is recorded as it goes: every step with its timing, and what
// each agent saved. A replay plays that recording back in a fraction of the
// time, writing the same results as it goes. Nothing in a replay is made up.

import { cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { briefNote, draftsNote, postsNote, rosterNote } from "@/lib/agents/notes";
import { findCreators } from "@/lib/agents/research";
import { trackHashtag } from "@/lib/agents/review";
import { runSales } from "@/lib/agents/sales-run";
import { writeBrief } from "@/lib/agents/strategy";
import {
  DATA_DIR,
  currentBrand,
  logRun,
  saveBrief,
  saveFoundRoster,
  savePosts,
} from "@/lib/files";

export type Stage = "Strategy" | "Research" | "Sales" | "Marketing";

type RecordedStage = {
  agent: Stage;
  steps: { label: string; ms: number }[];
  // The file this agent saved and what was in it.
  file: string;
  content: string;
  note: string;
};

export type Recording = {
  brand: string;
  recordedAt: string;
  seconds: number;
  stages: RecordedStage[];
};

const RECORDING = path.join(DATA_DIR, "replay.json");
// A recorded run that ships with the app, with the pictures it refers to,
// so a replay works on a server that has never run the agents.
const SHIPPED = path.join(process.cwd(), "demo");
// How long a replay takes, start to finish.
const REPLAY_MS = 24_000;

const load = async (file: string) => {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Recording;
  } catch {
    return null;
  }
};

// The latest run recorded here, or the one that ships with the app.
export const readRecording = async () =>
  (await load(RECORDING)) ?? (await load(path.join(SHIPPED, "replay.json")));

// A recording only fits the program it was made for.
export async function recordingForCurrentProgram(): Promise<Recording | null> {
  const [recording, brand] = await Promise.all([readRecording(), currentBrand()]);
  return recording && recording.brand === brand.name ? recording : null;
}

type OnStep = (agent: Stage, label: string) => void;

export async function runProgram(onStep: OnStep): Promise<void> {
  const brand = await currentBrand();
  const began = Date.now();
  const stages: RecordedStage[] = [];

  // Runs one agent, timing each step, then keeps a copy of what it saved.
  const stage = async (agent: Stage, file: string, work: (step: (label: string) => void) => Promise<string>) => {
    const steps: RecordedStage["steps"] = [];
    let last = Date.now();
    const note = await work((label) => {
      steps.push({ label, ms: Date.now() - last });
      last = Date.now();
      onStep(agent, label);
    });
    const content = await readFile(path.join(DATA_DIR, file), "utf8").catch(() => "");
    stages.push({ agent, steps, file, content, note });
    await logRun(agent, "the app", note);
  };

  let brief!: Awaited<ReturnType<typeof writeBrief>>["brief"];
  await stage("Strategy", "brief.json", async (step) => {
    brief = (await writeBrief(brand, new Date().toISOString().slice(0, 10), step)).brief;
    await saveBrief(brief);
    return briefNote(brief);
  });

  await stage("Research", "roster.json", async (step) =>
    rosterNote(await saveFoundRoster(await findCreators(brand, brief, step))),
  );

  await stage("Sales", "outreach.json", async (step) => draftsNote(await runSales(step)));

  if (brand.hashtag) {
    await stage("Marketing", "posts.json", async (step) => {
      const { added, posts } = await trackHashtag(brand, brief, step);
      if (added.length > 0) await savePosts(posts);
      return postsNote(posts);
    });
  }

  const recording: Recording = {
    brand: brand.name,
    recordedAt: new Date().toISOString(),
    seconds: Math.round((Date.now() - began) / 1000),
    stages,
  };
  await writeFile(RECORDING, JSON.stringify(recording));
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Plays the last real run back. The screens start empty, and each agent's
// saved result lands as its steps finish.
export async function replayProgram(onStep: OnStep): Promise<Recording> {
  const recording = await recordingForCurrentProgram();
  if (!recording) {
    throw new Error("There is no recorded run for this program yet. Run the program once first.");
  }

  // Start from empty: what is on the screens now is set aside, not deleted.
  const aside = path.join(DATA_DIR, "archive", `replay-${Date.now()}`);
  for (const file of ["brief.json", "roster.json", "outreach.json", "posts.json", "payouts.json"]) {
    try {
      await mkdir(aside, { recursive: true });
      await rename(path.join(DATA_DIR, file), path.join(aside, file));
    } catch {
      // Nothing saved for that screen.
    }
  }

  // The pictures the recording points at, for a server that never saved them.
  await cp(path.join(SHIPPED, "media"), path.join(DATA_DIR, "media"), {
    recursive: true,
    force: false,
  }).catch(() => undefined);

  const total = recording.stages.flatMap((stage) => stage.steps).reduce((sum, step) => sum + step.ms, 0);
  const scale = total > 0 ? REPLAY_MS / total : 1;

  for (const stage of recording.stages) {
    for (const step of stage.steps) {
      // Every step stays long enough to read, and none drags.
      await wait(Math.min(1800, Math.max(220, step.ms * scale)));
      onStep(stage.agent, step.label);
    }
    if (stage.content) await writeFile(path.join(DATA_DIR, stage.file), stage.content);
    await logRun(stage.agent, "the app", stage.note);
  }

  return recording;
}
