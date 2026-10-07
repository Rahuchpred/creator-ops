import Anthropic from "@anthropic-ai/sdk";
import { writeBrief } from "@/lib/agents/strategy";
import { brand } from "@/lib/data";
import { missingStrategyKeys, saveBrief } from "@/lib/store";

export const maxDuration = 300;

export type StrategyEvent =
  | { type: "step"; label: string }
  | { type: "done" }
  | { type: "error"; message: string };

function explain(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) {
    return "The model key was rejected. Check ANTHROPIC_API_KEY in .env.local.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "The model is rate limited right now. Wait a minute and run it again.";
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Could not reach the model. Check the connection and run it again.";
  }
  if (error instanceof Anthropic.APIError) {
    return `The model returned an error (${error.status}). Run it again.`;
  }
  return error instanceof Error ? error.message : "Something went wrong. Run it again.";
}

// Streams one JSON event per line so the page can show each step as it happens.
export async function POST() {
  const missing = missingStrategyKeys();
  if (missing.length > 0) {
    return Response.json(
      { type: "error", message: `Add ${missing.join(", ")} to .env.local and restart.` },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StrategyEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const today = new Date().toISOString().slice(0, 10);
        const { brief } = await writeBrief(brand, today, (label) => send({ type: "step", label }));
        await saveBrief(brief);
        send({ type: "done" });
      } catch (error) {
        console.error("Strategy agent failed", error);
        send({ type: "error", message: explain(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
