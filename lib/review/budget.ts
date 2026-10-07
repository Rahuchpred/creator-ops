// The month's budget ledger. Plain arithmetic on saved posts and approvals,
// with no I/O, so every dollar on the bar can be traced to a post.

import { brand as sampleBrand, posts as samplePosts, type Brand, type Post } from "@/lib/data";
import type { PayoutApproval } from "@/lib/files";
import { payoutApproved, payoutFor } from "@/lib/review/checks";

export type BudgetLedger = {
  // The month the ledger is for, as "2026-10".
  month: string;
  budget: number;
  // Payouts a person approved this month.
  paid: number;
  // Approved posts whose payout no person has approved yet.
  committed: number;
  // What the posts "In review" would earn if every one were approved.
  held: number;
  // What is left once paid, committed and held are all taken out. Never
  // under 0.
  remaining: number;
  // How far paid plus committed is past the budget. 0 when it is not.
  over: number;
  // How far the budget would be passed if every held post were approved.
  // 0 when it would not be.
  overIfHeldApproved: number;
};

const cents = (value: number) => Math.round(value * 100) / 100;

// Only program posts count (`submitted`), never the reviewer's test rows.
//
// Which month a dollar belongs to follows the money, not the day the video
// was posted: a payout counts in the month a person approved it, and money
// that is still open (committed or held) counts now, because this month's
// budget is what will pay it. A post from last month that is approved today
// is paid from this month.
export function budgetFor(
  posts: Post[],
  approvals: PayoutApproval[],
  brand: Brand,
  month: string,
): BudgetLedger {
  const program = posts.filter((post) => post.submitted);
  const earning = program.filter((post) => post.status === "Approved" && (post.payout ?? 0) > 0);

  let paid = 0;
  let committed = 0;
  for (const post of earning) {
    if (!payoutApproved(post, approvals)) {
      committed += post.payout ?? 0;
      continue;
    }
    const approval = approvals.find(
      (entry) => entry.postId === post.id && entry.amount === post.payout,
    );
    if (approval?.approvedAt.startsWith(month)) paid += post.payout ?? 0;
  }

  const held = program
    .filter((post) => post.status === "In review")
    .reduce(
      (sum, post) => sum + payoutFor({ status: "Approved", views: post.views }, brand),
      0,
    );

  const budget = brand.monthlyBudget;
  const spoken = paid + committed;
  return {
    month,
    budget,
    paid: cents(paid),
    committed: cents(committed),
    held: cents(held),
    remaining: cents(Math.max(0, budget - spoken - held)),
    over: cents(Math.max(0, spoken - budget)),
    overIfHeldApproved: cents(Math.max(0, spoken + held - budget)),
  };
}

// The same ledger for the sample program's made-up posts, so the sample
// screens show a filled bar. Nothing in it is approved by a person.
export function sampleLedger(month: string): BudgetLedger {
  return budgetFor(
    samplePosts.map((post) => ({ ...post, submitted: true, payout: payoutFor(post, sampleBrand) })),
    [],
    sampleBrand,
    month,
  );
}
