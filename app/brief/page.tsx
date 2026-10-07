import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Ban, BookOpen, Check, Quote, TrendingUp } from "lucide-react";
import { Tile, type TileColor } from "@/components/ui";
import { formatDay } from "@/lib/format";
import { getBrief, missingStrategyKeys } from "@/lib/store";
import { BriefHeader } from "./brief-header";

export const metadata: Metadata = { title: "Brief" };

function Title({ color, icon, children }: { color: TileColor; icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
      <Tile color={color} size="sm">
        {icon}
      </Tile>
      {children}
    </h2>
  );
}

function List({
  title,
  items,
  color,
  icon,
}: {
  title: string;
  items: string[];
  color: TileColor;
  icon: ReactNode;
}) {
  return (
    <section className="card p-6">
      <Title color={color} icon={icon}>
        {title}
      </Title>
      <ul className="mt-4 flex flex-col text-sm">
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
        <p className="mt-2 max-w-[40ch] text-2xl font-medium tracking-[-0.02em] text-balance md:text-[28px] md:leading-[1.2]">
          {brief.goal}
        </p>
        <h2 className="mt-6 text-xs font-medium text-faint">Angle</h2>
        <p className="mt-2 max-w-[65ch] text-pretty text-muted">{brief.angle}</p>
      </section>

      <section className="card p-6">
        <Title color="orange" icon={<Quote strokeWidth={2.25} />}>
          Opening lines to try
        </Title>
        <ol className="mt-4 flex flex-col text-sm">
          {brief.hooks.map((hook, index) => (
            <li key={hook} className="flex items-start gap-3 border-t border-line py-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fill text-xs font-medium tabular-nums text-muted">
                {index + 1}
              </span>
              <span className="pt-0.5 text-pretty">{hook}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <List
          title="Every post includes"
          items={brief.mustInclude}
          color="green"
          icon={<Check strokeWidth={2.5} />}
        />
        <List
          title="Leave out"
          items={brief.avoid}
          color="red"
          icon={<Ban strokeWidth={2.25} />}
        />
      </div>

      <section className="card p-6">
        <Title color="violet" icon={<TrendingUp strokeWidth={2.25} />}>
          What is working in this niche
        </Title>
        <ul className="mt-4 flex flex-col text-sm">
          {brief.references.map((reference) => (
            <li key={reference.title} className="border-t border-line py-3">
              {reference.url ? (
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline decoration-fill-strong decoration-2 underline-offset-4 hover:decoration-ink"
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
        <section className="card p-6">
          <Title color="grey" icon={<BookOpen strokeWidth={2.25} />}>
            {brief.sources.length} pages the agent read
          </Title>
          <ul className="mt-4 flex flex-col text-sm">
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
