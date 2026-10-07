import { writeBrief } from "@/lib/agents/strategy";
import { streamAgent } from "@/lib/agents/stream";
import { brand } from "@/lib/data";
import { missingStrategyKeys, saveBrief } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Strategy", missingStrategyKeys(), async (step) => {
    const today = new Date().toISOString().slice(0, 10);
    const { brief } = await writeBrief(brand, today, step);
    await saveBrief(brief);
  });
}
