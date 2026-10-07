"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { Check, Sparkles } from "lucide-react";
import { Spinner } from "@/components/agent-run";
import { Button, Tile, buttonClass } from "@/components/ui";
import { cx } from "@/lib/format";
import {
  fillProgramAction,
  saveProgramAction,
  type Field,
  type ProgramState,
} from "./actions";

const inputClass =
  "w-full rounded-[14px] bg-surface px-3.5 py-2.5 text-sm text-ink shadow-[0_0_0_1px_var(--color-fill-strong)] placeholder:text-faint hover:shadow-[0_0_0_1px_#d6d6db]";

export function ProgramForm({ start }: { start: Record<Field, string> }) {
  const [state, action, saving] = useActionState<ProgramState, FormData>(saveProgramAction, {
    values: start,
    errors: {},
  });

  // Fields drafted from pasted notes. They only apply to the form state
  // they were drafted on top of, so a later save always wins.
  const formRef = useRef<HTMLFormElement>(null);
  const [notes, setNotes] = useState("");
  const [filled, setFilled] = useState<{
    on: ProgramState;
    values: Record<Field, string>;
    count: number;
  } | null>(null);
  const [fillMessage, setFillMessage] = useState("");
  const [filling, startFilling] = useTransition();
  const values = filled?.on === state ? filled.values : state.values;

  const fill = () =>
    startFilling(async () => {
      setFillMessage("");
      const result = await fillProgramAction(notes);
      if (!result.values) {
        setFillMessage(result.message ?? "The notes could not be read. Try again.");
        return;
      }
      // Start from what is typed in the form now, so nothing typed is lost.
      const typed = Object.fromEntries(
        Object.keys(state.values).map((name) => [
          name,
          String(new FormData(formRef.current!).get(name) ?? ""),
        ]),
      ) as Record<Field, string>;
      setFilled({
        on: state,
        values: { ...typed, ...result.values },
        count: Object.keys(result.values).length,
      });
    });

  // One labelled control. The error sits right under the field it is about.
  const field = (
    name: Field,
    label: string,
    options: {
      hint?: string;
      placeholder?: string;
      rows?: number;
      number?: boolean;
      type?: "text" | "url";
      wide?: boolean;
    } = {},
  ) => {
    const error = state.errors[name];
    const shared = {
      id: name,
      name,
      defaultValue: values[name],
      placeholder: options.placeholder,
      autoComplete: "off",
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${name}-error` : options.hint ? `${name}-hint` : undefined,
      className: cx(inputClass, error && "shadow-[0_0_0_1px_var(--color-bad)]"),
    };
    return (
      <div className={cx("flex flex-col gap-1.5", options.wide && "md:col-span-2")}>
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
        {options.rows ? (
          <textarea {...shared} rows={options.rows} />
        ) : (
          <input
            {...shared}
            type={options.type ?? "text"}
            inputMode={options.number ? "decimal" : undefined}
            spellCheck={options.type === "url" ? false : undefined}
          />
        )}
        {error ? (
          <p id={`${name}-error`} role="alert" className="text-[13px] text-bad">
            {error}
          </p>
        ) : options.hint ? (
          <p id={`${name}-hint`} className="text-[13px] text-pretty text-faint">
            {options.hint}
          </p>
        ) : null}
      </div>
    );
  };

  const failed = Object.keys(state.errors).length > 0;

  return (
    // The key remounts the fields with what was typed, so a failed save
    // never clears the form.
    <form
      ref={formRef}
      action={action}
      key={JSON.stringify(values)}
      className="flex flex-col gap-6"
    >
      <section className="card flex flex-col gap-3 p-6" aria-labelledby="paste">
        <h2 id="paste" className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
          <Tile color="violet" size="sm">
            <Sparkles aria-hidden="true" />
          </Tile>
          Paste What You Have
        </h2>
        <label htmlFor="notes" className="text-sm text-pretty text-muted">
          A message, a pitch, a page from your site, rough bullet points. The fields below are
          filled from it for you to check. Nothing is saved until you press Save Program.
        </label>
        <textarea
          id="notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          autoComplete="off"
          placeholder="We are Lumen, a study timer app for students. Paying $1.20 per 1k views, max $400 a post…"
          className={inputClass}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fill} disabled={filling || notes.trim().length < 10}>
            {filling ? <Spinner /> : null}
            {filling ? "Reading…" : "Fill the Form"}
          </Button>
          <p aria-live="polite" className="min-w-0 text-sm text-pretty">
            {fillMessage ? (
              <span className="text-bad">{fillMessage}</span>
            ) : filled?.on === state && !filling ? (
              <span className="text-good">
                Filled {filled.count} {filled.count === 1 ? "field" : "fields"}. Check them, then
                save. Fields the notes did not cover were left as they were.
              </span>
            ) : null}
          </p>
        </div>
      </section>

      <section className="card p-6" aria-labelledby="about">
        <h2 id="about" className="text-base font-semibold tracking-tight">
          The brand
        </h2>
        <div className="mt-4 grid gap-x-6 gap-y-5 md:grid-cols-2">
          {field("name", "Brand name", { placeholder: "Lumen…" })}
          {field("website", "Website", {
            type: "url",
            placeholder: "https://lumen.app…",
            hint: "Optional. The Strategy agent reads it.",
          })}
          {field("product", "What the product is", {
            wide: true,
            rows: 2,
            placeholder: "A study timer app that locks your phone until the session ends…",
            hint: "One or two plain sentences. The agents search and write from this.",
          })}
          {field("audience", "Who it is for", {
            wide: true,
            placeholder: "University students, 18 to 24, who study from their phone…",
          })}
        </div>
      </section>

      <section className="card p-6" aria-labelledby="pay">
        <h2 id="pay" className="text-base font-semibold tracking-tight">
          Pay
        </h2>
        <div className="mt-4 grid gap-x-6 gap-y-5 md:grid-cols-2">
          {field("monthlyBudget", "Monthly budget, in dollars", { number: true, placeholder: "12000…" })}
          {field("ratePerThousandViews", "Pay per 1,000 views, in dollars", {
            number: true,
            placeholder: "1.20…",
          })}
          {field("payoutCapPerPost", "Most one post can earn, in dollars", {
            number: true,
            placeholder: "400…",
          })}
          {field("minimumViews", "Views before a post pays", { number: true, placeholder: "5000…" })}
        </div>
      </section>

      <section className="card p-6" aria-labelledby="creators">
        <h2 id="creators" className="text-base font-semibold tracking-tight">
          Creators and rules
        </h2>
        <div className="mt-4 grid gap-x-6 gap-y-5 md:grid-cols-2">
          {field("followersMin", "Smallest following to recruit", { number: true, placeholder: "3000…" })}
          {field("followersMax", "Largest following to recruit", { number: true, placeholder: "150000…" })}
          {field("hashtag", "Program hashtag", {
            wide: true,
            placeholder: "lumenpartner…",
            hint: "Optional. The tag creators put on program posts. With it set, the Posts screen can pull in tagged videos without pasting links.",
          })}
          {field("rules", "Rules every post follows", {
            wide: true,
            rows: 5,
            placeholder: "Mark every post as a paid partnership or use #ad…",
            hint: "One rule per line. Posts that break a rule are held or rejected.",
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? <Spinner /> : null}
          {saving ? "Saving…" : "Save Program"}
        </Button>
        <div aria-live="polite" className="min-w-0 text-sm">
          {failed ? (
            <span className="text-bad">Fix the marked fields, then save again.</span>
          ) : state.saved && !saving ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
              <span className="flex items-center gap-1.5 text-good">
                <Check aria-hidden="true" className="size-4" />
                Saved. The agents now work for {state.saved.name}.
              </span>
              {state.saved.moved ? (
                <span>Results for the previous brand were set aside.</span>
              ) : null}
              <Link href="/brief" className={buttonClass({ size: "sm" })}>
                Write the Brief
              </Link>
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
