import { TriangleAlert } from "lucide-react";
import { cx, formatAmount, formatDollars, formatMonth } from "@/lib/format";
import type { BudgetLedger } from "@/lib/review/budget";

// Each part of the bar has its own color and its own name in the legend.
// Held is striped as well, so it does not rest on color alone.
const parts = [
  {
    key: "paid",
    label: "Paid",
    hint: "Payouts you approved",
    look: "bg-linear-to-b from-[#6fdca0] to-[#1fa565]",
  },
  {
    key: "committed",
    label: "Committed",
    hint: "Approved posts, payout not approved yet",
    look: "bg-linear-to-b from-[#b9a4ff] to-[#7a55e8]",
  },
  {
    key: "held",
    label: "Held",
    hint: "What posts in review would earn",
    look: "bg-[repeating-linear-gradient(135deg,#ffc46b_0_5px,#f2802a_5px_10px)]",
  },
  {
    key: "remaining",
    label: "Remaining",
    hint: "Left after all three",
    look: "bg-fill-strong",
  },
] as const;

// The month's budget as one bar: paid, committed, held, and what is left.
// The numbers come from `budgetFor`. Nothing is worked out here but widths.
export function BudgetTracker({ ledger }: { ledger: BudgetLedger }) {
  const spoken = ledger.paid + ledger.committed;
  // The bar is as long as the budget, or as long as what is spoken for when
  // that is more.
  const scale = Math.max(ledger.budget, spoken + ledger.held, 1);
  const share = (value: number) => `${(value / scale) * 100}%`;
  const shown = parts.filter((part) => ledger[part.key] > 0);
  const summary = `${formatAmount(ledger.paid)} paid, ${formatAmount(ledger.committed)} committed, ${formatAmount(ledger.held)} held and ${formatAmount(ledger.remaining)} remaining, of a ${formatDollars(ledger.budget)} monthly budget.`;

  return (
    <section className="card p-6" aria-labelledby="budget">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="budget" className="text-base font-semibold tracking-tight">
          Budget for {formatMonth(ledger.month)}
        </h2>
        <p className="text-sm text-muted tabular-nums">
          <span className="font-medium text-ink">{formatAmount(spoken)}</span> of{" "}
          {formatDollars(ledger.budget)} paid or committed
        </p>
      </div>

      <div className="relative mt-4">
        <div
          role="img"
          aria-label={summary}
          className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-fill"
        >
          {shown.map((part) => (
            <span
              key={part.key}
              className={cx("block h-full min-w-1.5 rounded-[3px]", part.look)}
              style={{ width: share(ledger[part.key]) }}
            />
          ))}
        </div>
        {scale > ledger.budget ? (
          // Where the budget ends, when the bar runs past it.
          <span
            aria-hidden="true"
            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-ink"
            style={{ left: share(ledger.budget) }}
          />
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
        {parts.map((part) => (
          <div key={part.key} className="min-w-0">
            <dt className="flex items-center gap-2 text-sm text-muted">
              <span aria-hidden="true" className={cx("size-2.5 shrink-0 rounded-[4px]", part.look)} />
              {part.label}
            </dt>
            <dd className="mt-1 text-xl font-medium tracking-tight tabular-nums">
              {formatAmount(ledger[part.key])}
            </dd>
            <dd className="mt-0.5 text-xs text-pretty text-faint">{part.hint}</dd>
          </div>
        ))}
      </dl>

      {ledger.over > 0 ? (
        <p className="mt-5 flex items-start gap-2.5 rounded-[14px] bg-warn-soft px-4 py-3 text-sm text-pretty text-warn">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
          <span className="tabular-nums">
            Over budget. Paid and committed come to {formatAmount(spoken)}, which is{" "}
            {formatAmount(ledger.over)} more than this month&apos;s {formatDollars(ledger.budget)}.
          </span>
        </p>
      ) : ledger.overIfHeldApproved > 0 ? (
        <p className="mt-5 text-[13px] text-pretty text-muted tabular-nums">
          If every held post is approved, the month ends {formatAmount(ledger.overIfHeldApproved)}{" "}
          over budget.
        </p>
      ) : null}
    </section>
  );
}
