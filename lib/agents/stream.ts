import Anthropic from "@anthropic-ai/sdk";

export type AgentEvent =
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

// Runs one agent and streams a JSON event per line, so the page can show
// each step as it happens.
export function streamAgent(
  name: string,
  missingKeys: string[],
  work: (step: (label: string) => void) => Promise<void>,
) {
  if (missingKeys.length > 0) {
    return Response.json(
      { type: "error", message: `Add ${missingKeys.join(", ")} to .env.local and restart.` },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await work((label) => send({ type: "step", label }));
        send({ type: "done" });
      } catch (error) {
        console.error(`${name} agent failed`, error);
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
