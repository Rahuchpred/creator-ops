import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/ui";
import { missingSalesKeys } from "@/lib/store";
import { AskRoom } from "./ask-room";

export const metadata: Metadata = { title: "Ask the team" };

// The key check reads the environment, so it waits for a request.
async function Room() {
  await connection();
  const missing = missingSalesKeys();
  return <AskRoom missingKeys={missing} />;
}

export default function AskPage() {
  return (
    <>
      <PageHeader
        title="Ask the team"
        description="An investor meeting with the four AI employees. Ask anything about the company, the product, the market or the money, and the one who owns that area answers."
      />
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted">
            Getting the team in the room…
          </p>
        }
      >
        <Room />
      </Suspense>
    </>
  );
}
