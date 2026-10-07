"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AgentTile, SectionLabel } from "@/components/ui";

export type Day = {
  label: string;
  handoffs: {
    id: string;
    at: string;
    time: string;
    from: string;
    to: string;
    summary: string;
    note: string;
  }[];
};

// Every handoff is one row of the same height: who, to whom, the first line
// of the note and the time. The full note opens under its row.
export function Timeline({ days }: { days: Day[] }) {
  return (
    <div className="flex flex-col gap-6">
      {days.map((day) => (
        <section key={day.label} className="flex flex-col gap-3">
          <SectionLabel>{day.label}</SectionLabel>
          <ol className="card overflow-hidden">
            {day.handoffs.map((handoff) => (
              <li key={handoff.id} className="border-line not-first:border-t">
                <Collapsible.Root>
                  <Collapsible.Trigger className="group grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left text-sm hover:bg-surface focus-visible:bg-surface focus-visible:outline-offset-[-2px] md:h-14 md:grid-cols-[13.5rem_minmax(0,1fr)_auto] md:gap-x-4 md:px-5 md:py-0">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <AgentTile agent={handoff.from} size="sm" />
                      <span className="sr-only">{handoff.from} handed to</span>
                      <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-faint" />
                      <AgentTile agent={handoff.to} size="sm" />
                      <span className="truncate">{handoff.to}</span>
                    </span>
                    <span className="truncate text-muted max-md:order-last max-md:col-span-2">
                      {handoff.summary}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-faint tabular-nums">
                      <time dateTime={handoff.at}>{handoff.time}</time>
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 transition-transform duration-150 group-data-[panel-open]:rotate-180 motion-reduce:transition-none"
                      />
                    </span>
                  </Collapsible.Trigger>
                  <Collapsible.Panel className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
                    <div className="border-t border-line bg-surface px-4 py-4 md:px-5 md:pl-[15.75rem]">
                      <div className="text-xs font-medium text-faint">
                        {handoff.from} to {handoff.to}
                      </div>
                      <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed break-words whitespace-pre-line text-muted">
                        {handoff.note}
                      </p>
                    </div>
                  </Collapsible.Panel>
                </Collapsible.Root>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
