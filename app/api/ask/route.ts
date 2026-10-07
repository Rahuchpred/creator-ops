import { z } from "zod";
import { askTeam, EMPLOYEES, type Employee } from "@/lib/agents/ask";
import { explain } from "@/lib/agents/stream";
import { missingSalesKeys } from "@/lib/store";

export const maxDuration = 120;

// What the page reads, one JSON object per line: who is answering, then the
// answer in pieces, then done or a plain error.
export type AskEvent =
  | { type: "employee"; employee: Employee; reason: string }
  | { type: "text"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

const Body = z.object({
  question: z
    .string({ error: "Send a question to ask the team." })
    .trim()
    .min(1, "Type a question first.")
    .max(1000, "Keep the question under 1,000 characters."),
  history: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("investor"), text: z.string().trim().min(1).max(1000) }),
        z.object({
          role: z.literal("employee"),
          employee: z.enum(EMPLOYEES),
          text: z.string().trim().min(1).max(6000),
        }),
      ]),
    )
    .max(40)
    .default([]),
});

const refuse = (message: string) =>
  Response.json({ type: "error", message } satisfies AskEvent, { status: 400 });

export async function POST(request: Request) {
  // Answering only needs the model key, the same as the Sales agent.
  const missing = missingSalesKeys();
  if (missing.length > 0) {
    return refuse(`Add ${missing.join(", ")} to .env.local and restart.`);
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return refuse(parsed.error.issues[0]?.message ?? "Send a question to ask the team.");
  }
  const { question, history } = parsed.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AskEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The page went away. The model call is stopped through the signal.
        }
      };
      try {
        await askTeam(question, history, {
          onEmployee: (employee, reason) => send({ type: "employee", employee, reason }),
          onText: (delta) => send({ type: "text", delta }),
          signal: request.signal,
        });
        send({ type: "done" });
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("Ask the team failed", error);
          // The shared wording says "run it again", which fits an agent run.
          send({ type: "error", message: explain(error).replace(/Run it again/g, "Ask it again").replace(/run it again/g, "ask it again") });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by the page leaving.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
