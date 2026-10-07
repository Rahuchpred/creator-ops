import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { AgentTile, PageHeader } from "@/components/ui";
import { getActivity } from "@/lib/store";

export const metadata: Metadata = { title: "Activity" };

const time = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

async function Handoffs() {
  const activity = await getActivity();

  if (activity.length === 0) {
    return (
      <p className="card p-10 text-center text-sm text-pretty text-muted">
        No handoffs yet. Start the agent worker, then mention the Strategy agent in the BAND room
        to ask for a brief.
      </p>
    );
  }

  return (
    <ol className="card flex flex-col">
      {activity.map((handoff) => (
        <li
          key={`${handoff.at}-${handoff.from}`}
          className="border-line p-6 not-first:border-t"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <AgentTile agent={handoff.from} size="sm" />
            {handoff.from}
            <ArrowRight aria-hidden="true" className="mx-1 size-4 text-faint" />
            <AgentTile agent={handoff.to} size="sm" />
            {handoff.to}
            <time dateTime={handoff.at} className="ml-auto text-xs font-normal text-faint tabular-nums">
              {time.format(new Date(handoff.at))}
            </time>
          </div>
          <p className="mt-3 max-w-[70ch] text-sm leading-relaxed break-words whitespace-pre-line text-muted">
            {handoff.note}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        title="Activity"
        description="Every time one agent hands work to the next. The same messages appear in the BAND room, where you can reply to them."
      />
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted">
            Loading activity…
          </p>
        }
      >
        <Handoffs />
      </Suspense>
    </>
  );
}
