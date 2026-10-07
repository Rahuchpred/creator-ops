import { findCreators } from "@/lib/agents/research";
import { streamAgent } from "@/lib/agents/stream";
import { brand, brief as sampleBrief } from "@/lib/data";
import { readBrief } from "@/lib/files";
import { missingResearchKeys, saveRoster } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Research", missingResearchKeys(), async (step) => {
    const brief = (await readBrief()) ?? sampleBrief;
    await saveRoster(await findCreators(brand, brief, step));
  });
}
