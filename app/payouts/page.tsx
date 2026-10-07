import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { brand, payouts as samplePayouts } from "@/lib/data";
import { formatDollars, formatMoney, formatNumber } from "@/lib/format";
import { payoutsFrom } from "@/lib/review/checks";
import { getPosts } from "@/lib/store";
import { PayoutsList } from "./payouts-list";

export const metadata: Metadata = { title: "Payouts" };

// Read per request. Once the Review agent has run, the rows come from the
// posts it approved, not from the sample data.
async function PayoutsView() {
  const { posts, sample } = await getPosts();
  const payouts = sample ? samplePayouts : payoutsFrom(posts);

  if (payouts.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-sm font-semibold">No payouts yet</h2>
        <p className="mx-auto mt-1 max-w-[52ch] text-sm text-pretty text-muted">
          None of the {posts.length} reviewed posts earned a payout. A post pays once it is
          approved and passes {formatNumber(brand.minimumViews)} views. Open Posts to see why
          each one was held or rejected.
        </p>
      </div>
    );
  }

  // A payout row only carries a handle, so the picture comes from the posts.
  const avatars: Record<string, string> = {};
  for (const post of posts) if (post.avatar) avatars[post.handle] = post.avatar;
  return <PayoutsList payouts={payouts} avatars={avatars} />;
}

export default function PayoutsPage() {
  return (
    <>
      <PageHeader
        title="Payouts"
        description={`Approved posts pay ${formatMoney(brand.ratePerThousandViews)} per 1,000 views, up to ${formatDollars(brand.payoutCapPerPost)} a post, once they pass ${formatNumber(brand.minimumViews)} views.`}
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
