import { rosterNote } from "@/lib/agents/notes";
import { findCreators } from "@/lib/agents/research";
import { streamAgent } from "@/lib/agents/stream";
import { briefForWork, currentBrand, logRun, saveFoundRoster } from "@/lib/files";
import { missingResearchKeys } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Research", missingResearchKeys(), async (step) => {
    const brief = await briefForWork();
    const roster = await saveFoundRoster(await findCreators(await currentBrand(), brief, step));
    await logRun("Research", "the app", rosterNote(roster));
  });
}
