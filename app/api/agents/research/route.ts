import { findCreators } from "@/lib/agents/research";
import { streamAgent } from "@/lib/agents/stream";
import { briefForWork, currentBrand } from "@/lib/files";
import { missingResearchKeys, saveRoster } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Research", missingResearchKeys(), async (step) => {
    const brief = await briefForWork();
    await saveRoster(await findCreators(await currentBrand(), brief, step));
  });
}
