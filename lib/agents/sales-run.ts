import { draftOutreach, type Prospect } from "@/lib/agents/sales";
import {
  briefForWork,
  currentBrand,
  readOutreach,
  readRoster,
  saveOutreach,
  type Outreach,
} from "@/lib/files";

// The most creators one run writes to, so a person can read every draft.
const LIMIT = 8;

// One Sales run: drafts a message for each suggested creator on the saved
// roster who has no approved draft yet, and saves the drafts for approval.
// Approved drafts are kept as they are. Returns the new drafts only. Kept
// free of framework imports so the agent worker can use it too.
export async function runSales(onStep: (label: string) => void): Promise<Outreach[]> {
  const roster = await readRoster();
  if (!roster) {
    throw new Error("There is no roster yet. Run the Research agent first, then draft outreach.");
  }

  const approved = ((await readOutreach()) ?? []).filter((draft) => draft.status === "Approved");
  const done = new Set(approved.map((draft) => draft.handle));

  const everySuggested = roster.filter((creator) => creator.status === "Suggested");
  if (everySuggested.length === 0) {
    throw new Error(
      "The roster has no suggested creators. Run the Research agent again, then draft outreach.",
    );
  }
  const suggested = everySuggested
    .filter((creator) => !done.has(creator.handle))
    .sort((a, b) => (b.score ?? b.fit) - (a.score ?? a.fit))
    .slice(0, LIMIT);
  if (suggested.length === 0) {
    throw new Error(
      "Every suggested creator already has an approved draft, so there is nothing new to write. Run the Research agent to find more creators.",
    );
  }

  const prospects: Prospect[] = suggested.map((creator) => ({
    handle: creator.handle,
    name: creator.name,
    platform: creator.platform,
    niche: creator.niche,
    followers: creator.followers,
    averageViews: creator.averageViews,
    note: creator.reason,
  }));

  const brief = await briefForWork();
  const drafts = await draftOutreach(await currentBrand(), brief, prospects, onStep);

  const draftedAt = new Date().toISOString();
  const outreach: Outreach[] = drafts
    .filter((draft) => !done.has(draft.handle))
    .map((draft) => ({ ...draft, status: "Awaiting approval", draftedAt }));
  // New drafts first, since they are the ones waiting for a person.
  await saveOutreach([...outreach, ...approved]);
  return outreach;
}
