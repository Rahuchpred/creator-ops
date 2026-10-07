import type { Metadata } from "next";
import { Suspense } from "react";
import { formatDay } from "@/lib/format";
import { getBrief, missingStrategyKeys } from "@/lib/store";
import { BriefHeader } from "./brief-header";

export const metadata: Metadata = { title: "Brief" };

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 flex flex-col text-sm">
        {items.map((item) => (
          <li key={item} className="border-t border-line py-3 text-pretty">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Reads the saved brief on every request, so a brief the agent just wrote
// shows up as soon as the page refreshes.
async function BriefView() {
  const brief = await getBrief();

  return (
    <>
      <BriefHeader
        updated={formatDay(brief.updatedAt)}
        writtenBy={brief.writtenBy}
        missingKeys={missingStrategyKeys()}
      />

      <section className="card p-6 md:p-8">
        <h2 className="text-xs font-medium text-faint">Goal</h2>
        <p className="mt-2 max-w-[40ch] text-2xl font-semibold tracking-tight text-balance">
          {brief.goal}
        </p>
        <h2 className="mt-6 text-xs font-medium text-faint">Angle</h2>
        <p className="mt-2 max-w-[65ch] text-pretty text-muted">{brief.angle}</p>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold">Opening lines to try</h2>
        <ol className="mt-3 flex flex-col text-sm">
          {brief.hooks.map((hook, index) => (
            <li key={hook} className="flex gap-4 border-t border-line py-3">
              <span className="w-4 shrink-0 tabular-nums text-faint">{index + 1}</span>
              <span className="text-pretty">{hook}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <List title="Every post includes" items={brief.mustInclude} />
        <List title="Leave out" items={brief.avoid} />
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-semibold">What is working in this niche</h2>
        <ul className="mt-3 flex flex-col text-sm">
          {brief.references.map((reference) => (
            <li key={reference.title} className="border-t border-line py-3">
              {reference.url ? (
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-600 underline decoration-brand-200 underline-offset-4 hover:decoration-brand-500"
                >
                  {reference.title}
                </a>
              ) : (
                <div className="font-medium">{reference.title}</div>
              )}
              <div className="mt-0.5 text-pretty text-muted">{reference.why}</div>
            </li>
          ))}
        </ul>
      </section>

      {brief.sources.length > 0 ? (
        <section className="card p-5">
          <h2 className="text-sm font-semibold">
            {brief.sources.length} pages the agent read
          </h2>
          <ul className="mt-3 flex flex-col text-sm">
            {brief.sources.map((source) => (
              <li key={source.url} className="flex min-w-0 gap-3 border-t border-line py-2.5">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate hover:underline"
                >
                  {source.title}
                </a>
                <span className="ml-auto shrink-0 text-faint">{source.site}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

export default function BriefPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-muted">
          Loading the brief…
        </p>
      }
    >
      <BriefView />
    </Suspense>
  );
}
