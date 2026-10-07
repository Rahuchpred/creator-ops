import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { brand, payouts } from "@/lib/data";
import { formatDollars, formatMoney, formatNumber } from "@/lib/format";
import { PayoutsTable } from "./payouts-table";

export const metadata: Metadata = { title: "Payouts" };

export default function PayoutsPage() {
  return (
    <>
      <PageHeader
        title="Payouts"
        description={`Approved posts pay ${formatMoney(brand.ratePerThousandViews)} per 1,000 views, up to ${formatDollars(brand.payoutCapPerPost)} a post, once they pass ${formatNumber(brand.minimumViews)} views.`}
      />
      <PayoutsTable payouts={payouts} />
    </>
  );
}
