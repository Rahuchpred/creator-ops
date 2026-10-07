import { draftOutreach, type Prospect } from "@/lib/agents/sales";
import { briefForWork, currentBrand, readRoster, saveOutreach, type Outreach } from "@/lib/files";

// The most creators one run writes to, so a person can read every draft.
const LIMIT = 8;

// One Sales run: drafts a message for each suggested creator on the saved
// roster and saves the drafts for approval. Kept free of framework imports so
// the agent worker can use it too.
export async function runSales(onStep: (label: string) => void): Promise<Outreach[]> {
  const roster = await readRoster();
  if (!roster) {
    throw new Error("There is no roster yet. Run the Research agent first, then draft outreach.");
  }

  const suggested = roster
    .filter((creator) => creator.status === "Suggested")
    .sort((a, b) => (b.score ?? b.fit) - (a.score ?? a.fit))
    .slice(0, LIMIT);
  if (suggested.length === 0) {
    throw new Error(
      "The roster has no suggested creators. Run the Research agent again, then draft outreach.",
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
  const outreach: Outreach[] = drafts.map((draft) => ({
    ...draft,
    status: "Awaiting approval",
    draftedAt,
  }));
  await saveOutreach(outreach);
  return outreach;
}
