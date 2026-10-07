import { briefNote } from "@/lib/agents/notes";
import { writeBrief } from "@/lib/agents/strategy";
import { streamAgent } from "@/lib/agents/stream";
import { currentBrand, logRun } from "@/lib/files";
import { missingStrategyKeys, saveBrief } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Strategy", missingStrategyKeys(), async (step) => {
    const today = new Date().toISOString().slice(0, 10);
    const { brief } = await writeBrief(await currentBrand(), today, step);
    await saveBrief(brief);
    await logRun("Strategy", "the app", briefNote(brief));
  });
}
