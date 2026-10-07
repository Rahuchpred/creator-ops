import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge, PageHeader } from "@/components/ui";
import { getProgram } from "@/lib/store";
import { ProgramForm } from "./program-form";

export const metadata: Metadata = { title: "Program setup" };

// Read per request, so the form always opens on what is saved.
async function ProgramView() {
  const { brand, sample } = await getProgram();
  return (
    <>
      {sample ? (
        <p className="card px-5 py-4 text-sm text-pretty text-muted">
          <Badge>Sample</Badge>{" "}
          This is a made-up program so the screens have something to show. Replace it with your
          own and save. The agents work from whatever is saved here.
        </p>
      ) : null}
      <ProgramForm
        start={{
          name: brand.name,
          website: brand.website ?? "",
          product: brand.product,
          audience: brand.audience,
          monthlyBudget: String(brand.monthlyBudget),
          ratePerThousandViews: String(brand.ratePerThousandViews),
          payoutCapPerPost: String(brand.payoutCapPerPost),
          minimumViews: String(brand.minimumViews),
          followersMin: String(brand.creatorFollowers.min),
          followersMax: String(brand.creatorFollowers.max),
          hashtag: brand.hashtag ?? "",
          rules: brand.rules.join("\n"),
        }}
      />
    </>
  );
}

export default function ProgramPage() {
  return (
    <>
      <PageHeader
        title="Program setup"
        description="Tell the agents who they work for: the brand, what it pays and the rules. Every brief, roster, draft and review starts from this page."
      />
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted">
            Loading the program…
          </p>
        }
      >
        <ProgramView />
      </Suspense>
    </>
  );
}
