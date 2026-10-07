import type { Metadata } from "next";
import { Suspense } from "react";
import { BudgetTracker } from "@/components/budget-tracker";
import { PageHeader } from "@/components/ui";
import { payouts as samplePayouts } from "@/lib/data";
import { formatDollars, formatMoney, formatNumber } from "@/lib/format";
import { budgetFor, sampleLedger } from "@/lib/review/budget";
import { payoutApproved, payoutsByApproval } from "@/lib/review/checks";
import { getPayoutApprovals, getPosts, getProgram } from "@/lib/store";
import { PayoutsList, type PayoutRow } from "./payouts-list";

export const metadata: Metadata = { title: "Payouts" };

// Read per request. Once the Marketing agent has run, the rows come from the
// posts it approved, not from the sample data, and a person's approvals are
// read back from disk.
async function PayoutsView() {
  const [{ posts, sample }, { brand }, approvals] = await Promise.all([
    getPosts(),
    getProgram(),
    getPayoutApprovals(),
  ]);
  const { waiting, approved } = payoutsByApproval(posts, approvals);
  const month = new Date().toISOString().slice(0, 7);
  const budget = (
    <BudgetTracker ledger={sample ? sampleLedger(month) : budgetFor(posts, approvals, brand, month)} />
  );
  // A waiting row carries the posts and amounts it stands for, so approving
  // it records exactly what the person saw.
  const payouts: PayoutRow[] = sample
    ? samplePayouts
    : [
        ...waiting.map((row) => ({
          ...row,
          items: posts
            .filter(
              (post) =>
                post.handle === row.handle &&
                post.status === "Approved" &&
                (post.payout ?? 0) > 0 &&
                !payoutApproved(post, approvals),
            )
            .map((post) => ({ postId: post.id, amount: post.payout ?? 0 })),
        })),
        ...approved,
      ];

  if (payouts.length === 0) {
    return (
      <>
        {budget}
        <div className="card p-8 text-center">
          <h2 className="text-sm font-semibold">No payouts yet</h2>
          <p className="mx-auto mt-1 max-w-[52ch] text-sm text-pretty text-muted">
            None of the {posts.length} reviewed posts earned a payout. A post pays once it is
            approved and passes {formatNumber(brand.minimumViews)} views. Open Posts to see why
            each one was held or rejected.
          </p>
        </div>
      </>
    );
  }

  // A payout row only carries a handle, so the picture comes from the posts.
  const avatars: Record<string, string> = {};
  for (const post of posts) if (post.avatar) avatars[post.handle] = post.avatar;
  return (
    <>
      {budget}
      <PayoutsList payouts={payouts} avatars={avatars} sample={sample} />
    </>
  );
}

// The pay terms come from the saved program.
async function Terms() {
  const { brand } = await getProgram();
  return (
    <>
      Approved posts pay {formatMoney(brand.ratePerThousandViews)} per 1,000 views, up to{" "}
      {formatDollars(brand.payoutCapPerPost)} a post, once they pass{" "}
      {formatNumber(brand.minimumViews)} views.
    </>
  );
}

export default function PayoutsPage() {
  return (
    <>
      <PageHeader
        title="Payouts"
        description={
          <Suspense fallback="Approved posts are paid per 1,000 views.">
            <Terms />
          </Suspense>
        }
      />
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted">
            Loading the payouts…
          </p>
        }
      >
        <PayoutsView />
      </Suspense>
    </>
  );
}
