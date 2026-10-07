import { z } from "zod";
import { streamAgent } from "@/lib/agents/stream";
import { replayProgram, runProgram } from "@/lib/program-run";
import { missingResearchKeys, missingStrategyKeys } from "@/lib/store";

export const maxDuration = 600;

const Body = z.object({ replay: z.boolean().optional() });

// One press runs every agent in order. With `replay`, the last real run is
// played back in a fraction of the time and no agent is called.
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => ({})));
  const replay = body.success && body.data.replay === true;
  const missing = replay ? [] : [...new Set([...missingStrategyKeys(), ...missingResearchKeys()])];

  return streamAgent("Program", missing, async (step) => {
    let agent = "";
    const say = (next: string, label: string) => {
      if (next !== agent) {
        agent = next;
        step(`${next} agent started`);
      }
      step(label);
    };
    if (replay) await replayProgram(say);
    else await runProgram(say);
  });
}
