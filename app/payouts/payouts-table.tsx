"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { BlueField } from "@/components/blue-field";
import { Badge, Button, Handle, buttonClass, tableClass as t } from "@/components/ui";
import type { Payout, PayoutStatus } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";

const statusTone = {
  "Awaiting approval": "warn",
  Approved: "brand",
  Paid: "good",
} as const satisfies Record<PayoutStatus, string>;

export function PayoutsTable({ payouts }: { payouts: Payout[] }) {
  // Approvals live in memory until the database lands at the end of stage 1.
  const [approved, setApproved] = useState<string[]>([]);
  // The chosen row stays set while the dialog animates out, so its text does
  // not blank mid-close.
  const [pending, setPending] = useState<Payout | null>(null);
  const [open, setOpen] = useState(false);

  const rows = payouts.map((payout) =>
    approved.includes(payout.handle) ? { ...payout, status: "Approved" as const } : payout,
  );
  const waiting = rows.filter((row) => row.status === "Awaiting approval");
  const waitingTotal = waiting.reduce((sum, row) => sum + row.amount, 0);

  const approve = (handles: string[]) => {
    setApproved((current) => [...new Set([...current, ...handles])]);
    setOpen(false);
  };

  return (
    <>
      <section
        aria-label="Waiting for approval"
        className="brand-field relative overflow-hidden rounded-[24px] text-white"
      >
        <BlueField className="absolute inset-0 size-full" />
        <div className="relative flex flex-wrap items-end justify-between gap-4 p-6 md:p-9">
          <div aria-live="polite">
            <div className="text-4xl font-medium tracking-[-0.03em] tabular-nums md:text-5xl">
              {formatMoney(waitingTotal)}
            </div>
            <div className="mt-2 text-sm text-white/85">
              {waiting.length === 0
                ? "Nothing is waiting for approval"
                : `Waiting for approval across ${waiting.length} ${waiting.length === 1 ? "creator" : "creators"}`}
            </div>
          </div>
          <button
            type="button"
            disabled={waiting.length === 0}
            onClick={() => approve(waiting.map((row) => row.handle))}
            className="press inline-flex h-10 items-center rounded-full bg-white px-4.5 text-sm font-medium text-ink shadow-[0_1px_2px_rgb(16_17_20/0.2)] hover:bg-fill focus-visible:outline-white disabled:pointer-events-none disabled:opacity-60"
          >
            Approve all
          </button>
        </div>
      </section>

      <div className={t.wrap}>
        <table className={t.table}>
          <thead>
            <tr>
              <th scope="col" className={t.th}>Creator</th>
              <th scope="col" className={t.thRight}>Approved posts</th>
              <th scope="col" className={t.thRight}>Views</th>
              <th scope="col" className={t.thRight}>Amount</th>
              <th scope="col" className={t.th}>Status</th>
              <th scope="col" className={t.thRight}>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.handle} className={t.row}>
                <td className={t.td}>
                  <Handle handle={row.handle} />
                </td>
                <td className={t.tdRight}>{row.posts}</td>
                <td className={t.tdRight}>{formatNumber(row.views)}</td>
                <td className={`${t.tdRight} font-medium`}>{formatMoney(row.amount)}</td>
                <td className={t.td}>
                  <Badge tone={statusTone[row.status]}>{row.status}</Badge>
                </td>
                <td className={t.tdRight}>
                  {row.status === "Awaiting approval" ? (
                    <Button size="sm" onClick={() => {
                        setPending(row);
                        setOpen(true);
                      }}>
                      Approve
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
          <Dialog.Popup className="fixed rounded-[24px] bg-surface shadow-[0_0_0_1px_var(--color-line),0_24px_60px_-20px_rgb(16_17_20/0.3)] top-1/2 left-1/2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overscroll-contain p-6 transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <Dialog.Title className="text-xl font-medium tracking-[-0.02em]">
              Approve {pending ? formatMoney(pending.amount) : ""}?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-pretty text-muted">
              {pending
                ? `This marks @${pending.handle} as approved for ${pending.posts} ${pending.posts === 1 ? "post" : "posts"} and ${formatNumber(pending.views)} views. No money moves from this screen.`
                : ""}
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close className={buttonClass()}>Cancel</Dialog.Close>
              <Button variant="primary" onClick={() => pending && approve([pending.handle])}>
                Approve payout
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
