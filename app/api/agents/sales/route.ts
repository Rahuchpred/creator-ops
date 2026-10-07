import { draftsNote } from "@/lib/agents/notes";
import { runSales } from "@/lib/agents/sales-run";
import { streamAgent } from "@/lib/agents/stream";
import { logRun } from "@/lib/files";
import { missingSalesKeys } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Sales", missingSalesKeys(), async (step) => {
    await logRun("Sales", "the app", draftsNote(await runSales(step)));
  });
}
