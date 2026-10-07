import type { Metadata } from "next";
import { Suspense } from "react";
import { getOutreach, getRoster, missingSalesKeys } from "@/lib/store";
import { OutreachGrid, type Recipient } from "./outreach-grid";
import { OutreachHeader } from "./outreach-header";

export const metadata: Metadata = { title: "Outreach" };

// Read per request, so drafts the Sales agent just wrote show on refresh.
// A draft only carries a handle, so the name and picture come from the roster.
async function OutreachView() {
  const [outreach, { creators }] = await Promise.all([getOutreach(), getRoster()]);
  const people: Record<string, Recipient> = {};
  for (const { handle, name, avatar, followers } of creators) {
    people[handle] = { name, avatar, followers };
  }
  return (
    <>
      <OutreachHeader missingKeys={missingSalesKeys()} />
      <OutreachGrid outreach={outreach} people={people} />
    </>
  );
}

export default function OutreachPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-muted">
          Loading the drafts…
        </p>
      }
    >
      <OutreachView />
    </Suspense>
  );
}
