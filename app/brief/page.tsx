import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ArrowUpRight, Ban, Check, Quote, TrendingUp, X } from "lucide-react";
import { Tile, type TileColor } from "@/components/ui";
import { formatDay } from "@/lib/format";
import { getBrief, missingStrategyKeys } from "@/lib/store";
import { BriefHeader } from "./brief-header";
import { Sources } from "./sources";

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

// A short checklist for the side column: one mark, repeated down the list.
function Checklist({
  title,
  items,
  color,
  icon,
  mark,
}: {
  title: string;
  items: string[];
  color: TileColor;
  icon: ReactNode;
  mark: ReactNode;
}) {
  return (
    <section className="card p-5">
      <Title color={color} icon={icon}>
        {title}
      </Title>
      <ul className="mt-4 flex flex-col gap-3 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            {mark}
            <span className="min-w-0 text-pretty">{item}</span>
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

  if (!brief) {
    return (
      <>
        <BriefHeader missingKeys={missingStrategyKeys()} />
        <div className="card p-8 text-center">
          <h2 className="text-sm font-semibold">No brief yet</h2>
          <p className="mx-auto mt-1 max-w-[52ch] text-sm text-pretty text-muted">
            Press Write the brief. The Strategy agent researches what is working for this
            program right now and writes it in about two minutes.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <BriefHeader
        updated={formatDay(brief.updatedAt)}
        writtenBy={brief.writtenBy}
        missingKeys={missingStrategyKeys()}
      />

      {/* The document a creator reads on the left, the rules they check a
          video against on the right. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="card divide-y divide-line">
          <section className="p-6 md:p-8">
            <h2 className="text-xs font-medium text-faint">Goal</h2>
            <p className="mt-2 max-w-[32ch] text-2xl font-medium tracking-[-0.02em] text-balance md:text-[28px] md:leading-[1.2]">
              {brief.goal}
            </p>
            <h2 className="mt-6 text-xs font-medium text-faint">Angle</h2>
            <p className="mt-2 max-w-[62ch] leading-relaxed text-pretty text-muted">
              {brief.angle}
            </p>
          </section>

          <section className="p-6 md:p-8">
            <Title color="orange" icon={<Quote strokeWidth={2.25} />}>
              Opening lines to try
            </Title>
            <ol className="mt-4 flex flex-col gap-3.5 text-sm">
              {brief.hooks.map((hook, index) => (
                <li key={hook} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fill text-xs font-medium tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 pt-0.5 text-pretty">{hook}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="p-6 md:p-8">
            <Title color="violet" icon={<TrendingUp strokeWidth={2.25} />}>
              What is working in this niche
            </Title>
            <ul className="mt-4 flex flex-col gap-4 text-sm">
              {brief.references.map((reference) => (
                <li key={reference.title} className="min-w-0">
                  {reference.url ? (
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-start gap-1 font-medium underline decoration-fill-strong decoration-2 underline-offset-4 hover:decoration-ink"
                    >
                      <span className="min-w-0 break-words">{reference.title}</span>
                      <ArrowUpRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-faint" />
                    </a>
                  ) : (
                    <div className="font-medium">{reference.title}</div>
                  )}
                  <div className="mt-1 max-w-[62ch] leading-relaxed text-pretty text-muted">
                    {reference.why}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <div className="grid gap-6 sm:max-lg:grid-cols-2">
          <Checklist
            title="Every post includes"
            items={brief.mustInclude}
            color="green"
            icon={<Check strokeWidth={2.5} />}
            mark={<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-good" strokeWidth={2.5} />}
          />
          <Checklist
            title="Leave out"
            items={brief.avoid}
            color="red"
            icon={<Ban strokeWidth={2.25} />}
            mark={<X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-bad" strokeWidth={2.5} />}
          />
        </div>
      </div>

      {brief.sources.length > 0 ? <Sources sources={brief.sources} /> : null}
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
