import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { getActivity } from "@/lib/store";
import { Timeline, type Day } from "./timeline";

export const metadata: Metadata = { title: "Activity" };

const dayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const timeLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

// The dates are worded here, on the server, so every row arrives as plain
// text and the timeline only has to open and close notes.
async function Handoffs() {
  const activity = await getActivity();

  if (activity.length === 0) {
    return (
      <p className="card p-10 text-center text-sm text-pretty text-muted">
        Nothing has happened yet. Run an agent from its screen, for example Write the brief on the
        Brief screen, and what it did shows up here.
      </p>
    );
  }

  const days: Day[] = [];
  for (const handoff of activity) {
    const at = new Date(handoff.at);
    const label = dayLabel.format(at);
    if (days.at(-1)?.label !== label) days.push({ label, handoffs: [] });
    days.at(-1)?.handoffs.push({
      id: `${handoff.at}-${handoff.from}-${handoff.to}`,
      at: handoff.at,
      time: timeLabel.format(at),
      from: handoff.from,
      to: handoff.to,
      summary: handoff.note.split("\n").find((line) => line.trim()) ?? "",
      note: handoff.note,
    });
  }

  return <Timeline days={days} />;
}

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        title="Activity"
        description="Every time an agent finishes a run or hands work to the next one, newest first."
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
