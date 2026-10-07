import type { Metadata } from "next";
import { Suspense } from "react";
import { getRoster, missingResearchKeys } from "@/lib/store";
import { RosterHeader } from "./roster-header";
import { RosterRanking } from "./roster-ranking";

export const metadata: Metadata = { title: "Roster" };

// Read per request, so a roster the Research agent just built shows on refresh.
async function RosterView() {
  const { creators, sample } = await getRoster();
  return (
    <>
      <RosterHeader sample={sample} missingKeys={missingResearchKeys()} />
      <RosterRanking creators={creators} />
    </>
  );
}

export default function RosterPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-muted">
          Loading the roster…
        </p>
      }
    >
      <RosterView />
    </Suspense>
  );
}
