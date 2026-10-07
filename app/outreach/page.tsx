import type { Metadata } from "next";
import { Suspense } from "react";
import { getOutreach, missingSalesKeys } from "@/lib/store";
import { OutreachHeader } from "./outreach-header";
import { OutreachList } from "./outreach-list";

export const metadata: Metadata = { title: "Outreach" };

// Read per request, so drafts the Sales agent just wrote show on refresh.
async function OutreachView() {
  const outreach = await getOutreach();
  return (
    <>
      <OutreachHeader missingKeys={missingSalesKeys()} />
      <OutreachList outreach={outreach} />
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
