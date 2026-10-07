"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { ArrowUp, ChevronDown } from "lucide-react";
import { Spinner } from "@/components/agent-run";
import { AgentTile, Button } from "@/components/ui";
import type { AskEvent } from "@/app/api/ask/route";
import type { AskTurn, Employee } from "@/lib/agents/ask";
import { cx } from "@/lib/format";

// The twelve questions from the hackathon brief. The pill shows the short
// label and the full question is what gets asked.
const QUESTIONS = [
  { label: "What are you building?", full: "What are you building, and what problem are you solving?" },
  { label: "Who is the customer?", full: "Who is your ideal customer, and what evidence shows they need this?" },
  { label: "How big is the market?", full: "How big is the market, and how big can this company become?" },
  { label: "Who are the competitors?", full: "Who are your competitors, and why is your solution better?" },
  { label: "Why now?", full: "Why is now the right time for this company?" },
  { label: "How does the product work?", full: "How does your product work, and why will customers choose it?" },
  { label: "First 100 customers?", full: "How will you acquire your first 100 customers, and scale beyond that?" },
  { label: "Do the unit economics work?", full: "How does the company make money, and do the unit economics work?" },
  { label: "What traction so far?", full: "What traction or validation do you have so far?" },
  { label: "Biggest risks?", full: "What are the biggest risks, and how will you overcome them?" },
  { label: "What will the round do?", full: "What will you achieve with the next round of funding?" },
  { label: "Why invest?", full: "Why should we invest in this company?" },
];

const pillClass =
  "press h-9 cursor-pointer rounded-full bg-surface px-3.5 text-[13px] font-medium whitespace-nowrap shadow-[0_0_0_1px_var(--color-fill-strong),0_1px_2px_rgb(16_17_20/0.05)] hover:bg-fill disabled:pointer-events-none disabled:opacity-50";

// The suggested questions. The full question is the button's name, so a
// screen reader hears what will be asked.
function Pills({
  disabled,
  onAsk,
  className,
}: {
  disabled: boolean;
  onAsk: (question: string) => void;
  className?: string;
}) {
  return (
    <ul aria-label="Questions investors ask" className={cx("flex flex-wrap gap-2", className)}>
      {QUESTIONS.map((question) => (
        <li key={question.label}>
          <button
            type="button"
            title={question.full}
            aria-label={question.full}
            disabled={disabled}
            onClick={() => onAsk(question.full)}
            className={pillClass}
          >
            {question.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

const TEAM: Employee[] = ["Strategy", "Research", "Sales", "Marketing"];

type Answer = {
  id: number;
  question: string;
  employee: Employee | null;
  reason: string;
  text: string;
  state: "waiting" | "writing" | "done" | "failed";
  error?: string;
};

// New rows ease in. With reduced motion they fade without moving.
const arrive =
  "transition-[opacity,translate] duration-200 ease-out starting:translate-y-1.5 starting:opacity-0 motion-reduce:starting:translate-y-0";

// How close to the bottom still counts as following the conversation.
const FOLLOW_WITHIN = 160;

export function AskRoom({ missingKeys }: { missingKeys: string[] }) {
  const ready = missingKeys.length === 0;
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [draft, setDraft] = useState("");
  const [showQuestions, setShowQuestions] = useState(false);
  const fieldId = useId();
  const hintId = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const following = useRef(true);
  const nextId = useRef(1);
  const request = useRef<AbortController | null>(null);

  const busy = answers.some((answer) => answer.state === "waiting" || answer.state === "writing");
  const started = answers.length > 0;

  // Stop following when the reader scrolls up to read, pick it up again
  // when they come back down.
  useEffect(() => {
    const onScroll = () => {
      const page = document.documentElement;
      following.current = window.innerHeight + window.scrollY >= page.scrollHeight - FOLLOW_WITHIN;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (answers.length > 0 && following.current) {
      window.scrollTo({ top: document.documentElement.scrollHeight });
    }
  }, [answers]);

  // A question still being answered is dropped when the page is left.
  useEffect(() => () => request.current?.abort(), []);

  const update = (id: number, change: (answer: Answer) => Answer) =>
    setAnswers((rows) => rows.map((row) => (row.id === id ? change(row) : row)));

  async function ask(question: string, retryOf?: number) {
    const asked = question.trim();
    if (!asked || busy || !ready) return;

    // Only finished answers are sent back as the conversation so far.
    const history: AskTurn[] = answers
      .filter((answer) => answer.id !== retryOf && answer.state === "done" && answer.employee)
      .flatMap((answer) => [
        { role: "investor" as const, text: answer.question },
        { role: "employee" as const, employee: answer.employee as Employee, text: answer.text },
      ])
      .slice(-8);

    const id = nextId.current++;
    const fresh: Answer = { id, question: asked, employee: null, reason: "", text: "", state: "waiting" };
    setAnswers((rows) => [...rows.filter((row) => row.id !== retryOf), fresh]);
    setDraft("");
    setShowQuestions(false);
    following.current = true;

    const fail = (error: string) => update(id, (answer) => ({ ...answer, state: "failed", error }));
    const controller = new AbortController();
    request.current = controller;

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asked, history }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        return fail(body?.message ?? "The team could not take the question. Ask it again.");
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
          const event = JSON.parse(line) as AskEvent;
          if (event.type === "employee") {
            update(id, (answer) => ({ ...answer, employee: event.employee, reason: event.reason, state: "writing" }));
          } else if (event.type === "text") {
            update(id, (answer) => ({ ...answer, text: answer.text + event.delta, state: "writing" }));
          } else if (event.type === "error") {
            return fail(event.message);
          } else {
            finished = true;
          }
        }
      }
      if (!finished) return fail("The connection dropped before the answer finished. Ask it again.");
      update(id, (answer) => ({ ...answer, state: "done" }));
    } catch {
      if (!controller.signal.aborted) {
        fail("Could not reach the team. Check that the app is running and ask it again.");
      }
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
    field.current?.focus();
  }

  // Enter sends, Shift+Enter makes a new line. Enter that confirms a word in
  // an input method is left alone.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void ask(draft);
  }

  return (
    <div className="flex flex-col gap-6">
      {ready ? null : (
        <p role="alert" className="card px-5 py-4 text-sm text-pretty text-muted">
          The team cannot answer yet. Add{" "}
          {missingKeys.map((key, index) => (
            <span key={key}>
              {index > 0 ? ", " : ""}
              <code translate="no" className="font-mono text-[13px] text-ink">
                {key}
              </code>
            </span>
          ))}{" "}
          to <code className="font-mono text-[13px] text-ink">.env.local</code>, then restart the app.
        </p>
      )}

      {started ? null : (
        <section className="card flex flex-col items-center gap-4 px-5 py-9 text-center">
          <ul aria-label="The team" className="flex flex-wrap justify-center gap-2">
            {TEAM.map((employee) => (
              <li key={employee} title={employee}>
                <AgentTile agent={employee} />
                <span className="sr-only">{employee}</span>
              </li>
            ))}
          </ul>
          <p className="max-w-[46ch] text-[15px] leading-relaxed text-pretty text-muted">
            These are the company&apos;s AI employees. They answer from the company&apos;s own
            documents and live data, and they say so when something is not done yet.
          </p>
          <Pills
            disabled={busy || !ready}
            onAsk={(question) => void ask(question)}
            className="mt-2 justify-center"
          />
        </section>
      )}

      <div
        role="log"
        aria-live="polite"
        aria-busy={busy}
        aria-label="The conversation"
        className={cx("flex flex-col gap-7", !started && "hidden")}
      >
        {answers.map((answer) => (
          <article key={answer.id} className={cx("flex flex-col gap-4", arrive)}>
            <p className="max-w-[85%] self-end rounded-[22px] rounded-br-lg bg-fill px-4 py-2.5 text-[15px] leading-relaxed break-words text-pretty">
              <span className="sr-only">You asked: </span>
              {answer.question}
            </p>

            <div className="flex min-w-0 gap-3">
              <AgentTile agent={answer.employee ?? "the room"} />
              <div className="min-w-0 flex-1">
                <div className="flex min-h-10 flex-col justify-center">
                  <h2 className="text-sm font-semibold tracking-tight">
                    {answer.employee ?? "The team"}
                    {answer.employee ? <span className="sr-only"> answers</span> : null}
                  </h2>
                  <p className="text-xs text-pretty text-faint">
                    {answer.employee ? answer.reason : "Picking who answers…"}
                  </p>
                </div>

                {answer.text ? (
                  <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                    {answer.text}
                    {answer.state === "writing" ? (
                      <span
                        aria-hidden="true"
                        className="ml-1 inline-block size-2 animate-pulse rounded-full bg-faint align-baseline"
                      />
                    ) : null}
                  </p>
                ) : null}

                {answer.state === "failed" ? (
                  <div
                    role="alert"
                    className="mt-2 flex flex-wrap items-center gap-3 rounded-[16px] bg-bad-soft px-4 py-3 text-sm text-bad"
                  >
                    <span className="min-w-0 flex-1 break-words text-pretty">{answer.error}</span>
                    <Button size="sm" onClick={() => void ask(answer.question, answer.id)} disabled={busy}>
                      Ask Again
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* The question box stays at the bottom of the screen, so it is always in reach. */}
      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 bg-canvas px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-8 before:bg-linear-to-t before:from-canvas before:to-canvas/0 md:-mx-10 md:px-10">
        {started ? (
          <Collapsible.Root open={showQuestions} onOpenChange={setShowQuestions}>
            <Collapsible.Trigger className="group press flex cursor-pointer items-center gap-1.5 rounded-full py-1 pr-2 text-xs font-medium text-faint hover:text-ink">
              Questions investors ask
              <ChevronDown
                aria-hidden="true"
                className="size-3.5 transition-[rotate] duration-150 ease-out group-data-[panel-open]:rotate-180 motion-reduce:transition-none"
              />
            </Collapsible.Trigger>
            <Collapsible.Panel className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[ending-style]:duration-150 data-[starting-style]:h-0 motion-reduce:transition-none">
              {/* Padding leaves room for the focus ring inside the clipped panel. */}
              <Pills
                disabled={busy || !ready}
                onAsk={(question) => void ask(question)}
                className="max-h-[34dvh] overflow-y-auto overscroll-contain p-1 pt-2"
              />
            </Collapsible.Panel>
          </Collapsible.Root>
        ) : null}

        <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
          <label htmlFor={fieldId} className="px-1 text-xs font-medium text-faint">
            Your question
          </label>
          {/* The ring on the box stands in for the outline on the text area inside it. */}
          <div className="flex items-end gap-2 rounded-[26px] bg-surface p-2 pl-4 shadow-[0_0_0_1px_var(--color-fill-strong),0_10px_30px_-18px_rgb(16_17_20/0.3)] transition-[box-shadow] duration-150 ease-out focus-within:shadow-[0_0_0_2px_var(--color-brand-500),0_10px_30px_-16px_rgb(53_110_216/0.45)]">
            <textarea
              ref={field}
              id={fieldId}
              name="question"
              rows={1}
              maxLength={1000}
              autoComplete="off"
              enterKeyHint="send"
              aria-describedby={hintId}
              value={draft}
              disabled={!ready}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask the team anything…"
              className="field-sizing-content max-h-40 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-base leading-6 outline-none! placeholder:text-faint disabled:opacity-50"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={busy || !ready || draft.trim().length === 0}
              className="shrink-0"
            >
              {busy ? <Spinner /> : <ArrowUp aria-hidden="true" className="size-4" strokeWidth={2.5} />}
              {busy ? "Answering…" : "Send"}
            </Button>
          </div>
          <p id={hintId} className="px-1 text-xs text-faint max-sm:sr-only">
            Enter to send, Shift+Enter for a new line.
          </p>
        </form>
      </div>
    </div>
  );
}
