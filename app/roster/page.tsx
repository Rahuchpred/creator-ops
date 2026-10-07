import type { Metadata } from "next";
import { Suspense } from "react";
import { Button, PageHeader } from "@/components/ui";
import { creators } from "@/lib/data";
import { RosterTable } from "./roster-table";

export const metadata: Metadata = { title: "Roster" };

export default function RosterPage() {
  return (
    <>
      <PageHeader
        title="Roster"
        description="Creators matched to the brief, from first suggestion to onboarded. Fit is scored out of 100."
      >
        <Button variant="primary" disabled title="The Research agent is not connected yet">
          Find more creators
        </Button>
      </PageHeader>
      <Suspense>
        <RosterTable creators={creators} />
      </Suspense>
    </>
  );
}
