"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { AgentTile } from "@/components/ui";
import type { AgentEvent } from "@/lib/agents/stream";
import { cx } from "@/lib/format";

export type Run =
  | { state: "idle" }
  | { state: "running"; steps: string[] }
  | { state: "done"; steps: string[]; seconds: number; at: Date }
  | { state: "failed"; steps: string[]; message: string };

// Starts an agent, follows its steps as they stream in, and refreshes the
// page when it finishes so the new data shows.
export function useAgentRun(endpoint: string) {
  const router = useRouter();
  const [run, setRun] = useState<Run>({ state: "idle" });
  const steps = useRef<string[]>([]);

  const start = async () => {
    steps.current = [];
    const began = Date.now();
    setRun({ state: "running", steps: [] });

    const fail = (message: string) =>
      setRun({ state: "failed", steps: steps.current, message });

    try {
      const response = await fetch(endpoint, { method: "POST" });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        return fail(body?.message ?? "The agent could not start. Run it again.");
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line) as AgentEvent;
          if (event.type === "step") {
            steps.current = [...steps.current, event.label];
            setRun({ state: "running", steps: steps.current });
          } else if (event.type === "error") {
            return fail(event.message);
          } else {
            finished = true;
          }
        }
      }

      if (!finished) return fail("The connection dropped before the work was saved. Run it again.");
      setRun({
        state: "done",
        steps: steps.current,
        seconds: Math.round((Date.now() - began) / 1000),
        at: new Date(),
      });
      router.refresh();
    } catch {
      fail("Could not reach the agent. Check that the app is running and try again.");
    }
  };

  return { run, start, running: run.state === "running" };
}

// With reduced motion the spinner stops turning and breathes instead, so a
// wait never looks frozen.
const spin = "animate-spin motion-reduce:animate-pulse";

// The run panel and each new step ease in as they arrive, so the page does
// not jump. With reduced motion they fade without moving.
const arrive =
  "transition-[opacity,translate] duration-200 ease-out starting:translate-y-1.5 starting:opacity-0 motion-reduce:starting:translate-y-0";

export function Spinner() {
  return <LoaderCircle aria-hidden="true" className={cx("size-4", spin)} />;
}

export function MissingKeys({ agent, keys }: { agent: string; keys: string[] }) {
  if (keys.length === 0) return null;
  return (
    <p className="card px-5 py-4 text-sm text-pretty text-muted">
      The {agent} agent is not connected. Add{" "}
      {keys.map((key, index) => (
        <span key={key}>
          {index > 0 ? ", " : ""}
          <code translate="no" className="font-mono text-[13px] text-ink">
            {key}
          </code>
        </span>
      ))}{" "}
      to <code className="font-mono text-[13px] text-ink">.env.local</code>, then restart the app.
    </p>
  );
}

const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

function took(seconds: number) {
  if (seconds < 60) return `${seconds} sec`;
  return `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;
}

function Steps({ steps, running }: { steps: string[]; running: boolean }) {
  return (
    <ol aria-live="polite" className="mt-4 flex flex-col text-sm">
      {steps.map((step, index) => {
        const current = running && index === steps.length - 1;
        return (
          <li key={`${index}-${step}`} className={cx("flex gap-3 border-t border-line py-2.5", arrive)}>
            {current ? (
              <LoaderCircle
                aria-hidden="true"
                className={cx("mt-0.5 size-4 shrink-0 text-muted", spin)}
              />
            ) : (
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-good" />
            )}
            <span className="min-w-0 break-words text-pretty">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

// A finished run folds down to one line that says it is ready, so the new
// result sits right under it. The steps stay one press away.
function DonePanel({
  run,
  agent,
  doneTitle,
}: {
  run: Extract<Run, { state: "done" }>;
  agent: string;
  doneTitle: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className={cx("card p-5", arrive)} aria-label={`${agent} agent run`}>
      <div role="status" className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-good-soft text-good">
          <Check aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{doneTitle}</h2>
          <p className="text-sm text-muted tabular-nums">
            Ready at {clock.format(run.at)}, took {took(run.seconds)}. It is on this page now.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-line/60 hover:text-ink"
        >
          {open ? "Hide" : "Show"} {run.steps.length} steps
          <ChevronDown
            aria-hidden="true"
            className={cx("size-4 transition-[rotate] duration-200 ease-out", open && "rotate-180")}
          />
        </button>
      </div>
      {open ? <Steps steps={run.steps} running={false} /> : null}
    </section>
  );
}

export function AgentRunPanel({
  run,
  agent,
  doneTitle,
}: {
  run: Run;
  agent: string;
  doneTitle: string;
}) {
  if (run.state === "idle") return null;
  if (run.state === "done") return <DonePanel run={run} agent={agent} doneTitle={doneTitle} />;
  const running = run.state === "running";

  return (
    <section className={cx("card p-6", arrive)} aria-label={`${agent} agent run`}>
      <div className="flex items-center gap-3">
        <AgentTile agent={agent} />
        <h2 className="text-base font-semibold tracking-tight">
          {running ? `${agent} agent is working` : "The agent stopped"}
        </h2>
      </div>
      <Steps steps={run.steps} running={running} />
      {run.state === "failed" ? (
        <p role="alert" className="mt-3 rounded-[14px] bg-bad-soft px-4 py-3 text-sm text-bad">
          {run.message}
        </p>
      ) : null}
    </section>
  );
}
