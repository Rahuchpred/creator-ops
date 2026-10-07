"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import type { StrategyEvent } from "@/app/api/agents/strategy/route";
import { Badge, Button, PageHeader } from "@/components/ui";

type Run =
  | { state: "idle" }
  | { state: "running"; steps: string[] }
  | { state: "done"; steps: string[] }
  | { state: "failed"; steps: string[]; message: string };

export function BriefHeader({
  updated,
  writtenBy,
  missingKeys,
}: {
  updated: string;
  writtenBy: string;
  missingKeys: string[];
}) {
  const router = useRouter();
  const [run, setRun] = useState<Run>({ state: "idle" });
  const steps = useRef<string[]>([]);

  const start = async () => {
    steps.current = [];
    setRun({ state: "running", steps: [] });

    const fail = (message: string) =>
      setRun({ state: "failed", steps: steps.current, message });

    try {
      const response = await fetch("/api/agents/strategy", { method: "POST" });
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
          const event = JSON.parse(line) as StrategyEvent;
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

      if (!finished) return fail("The connection dropped before the brief was saved. Run it again.");
      setRun({ state: "done", steps: steps.current });
      router.refresh();
    } catch {
      fail("Could not reach the agent. Check that the app is running and try again.");
    }
  };

  const running = run.state === "running";
  const blocked = missingKeys.length > 0;

  return (
    <>
      <PageHeader
        title="Brief"
        description="What creators are asked to make. Every post is scored against this page."
      >
        <Badge>
          {writtenBy}, {updated}
        </Badge>
        <Button variant="primary" onClick={start} disabled={running || blocked}>
          {running ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : null}
          {running ? "Writing…" : "Write a new brief"}
        </Button>
      </PageHeader>

      {blocked ? (
        <p className="card p-4 text-sm text-pretty text-muted">
          The Strategy agent is not connected. Add{" "}
          {missingKeys.map((key, index) => (
            <span key={key}>
              {index > 0 ? ", " : ""}
              <code translate="no" className="font-mono text-[13px] text-ink">
                {key}
              </code>
            </span>
          ))}{" "}
          to <code className="font-mono text-[13px] text-ink">.env.local</code>, then restart the
          app.
        </p>
      ) : null}

      {run.state !== "idle" ? (
        <section className="card p-5" aria-labelledby="agent-run">
          <h2 id="agent-run" className="text-sm font-semibold">
            {run.state === "running"
              ? "Strategy agent is working"
              : run.state === "done"
                ? "New brief saved"
                : "The agent stopped"}
          </h2>
          <ol aria-live="polite" className="mt-3 flex flex-col text-sm">
            {run.steps.map((step, index) => {
              const current = running && index === run.steps.length - 1;
              return (
                <li key={`${index}-${step}`} className="flex gap-3 border-t border-line py-2.5">
                  {current ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 animate-spin text-brand-500 motion-reduce:animate-none"
                    />
                  ) : (
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-good" />
                  )}
                  <span className="min-w-0 break-words text-pretty">{step}</span>
                </li>
              );
            })}
          </ol>
          {run.state === "failed" ? (
            <p role="alert" className="mt-3 rounded-[10px] bg-bad-soft p-3 text-sm text-bad">
              {run.message}
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
