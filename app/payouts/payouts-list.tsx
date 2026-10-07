"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { BlueField } from "@/components/blue-field";
import { backdropClass, popupMotionClass } from "@/components/detail-dialog";
import { Badge, Button, Handle, SectionLabel, buttonClass } from "@/components/ui";
import type { Payout, PayoutStatus } from "@/lib/data";
import { cx, formatMoney, formatNumber } from "@/lib/format";

const statusTone = {
  "Awaiting approval": "warn",
  Approved: "brand",
  Paid: "good",
} as const satisfies Record<PayoutStatus, string>;

export function PayoutsList({
  payouts,
  avatars,
}: {
  payouts: Payout[];
  avatars: Record<string, string>;
}) {
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
  const settled = rows.filter((row) => row.status !== "Awaiting approval");
  const total = (list: Payout[]) => list.reduce((sum, row) => sum + row.amount, 0);

  const approve = (handles: string[]) => {
    setApproved((current) => [...new Set([...current, ...handles])]);
    setOpen(false);
  };

  // What is owed and what is done are two lists, each with its own total.
  const groups = [
    { id: "waiting", label: "Waiting for approval", rows: waiting },
    { id: "settled", label: "Approved and paid", rows: settled },
  ].filter((group) => group.rows.length > 0);

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
              {formatMoney(total(waiting))}
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

      {groups.map((group) => (
        <section key={group.id} aria-labelledby={group.id} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <SectionLabel id={group.id}>{group.label}</SectionLabel>
            <span className="text-xs text-faint tabular-nums">
              {group.rows.length} {group.rows.length === 1 ? "creator" : "creators"},{" "}
              {formatMoney(total(group.rows))}
            </span>
          </div>
          <ul className="card">
            {group.rows.map((row) => (
              <li
                key={row.handle}
                className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-line px-4 py-3.5 text-sm not-first:border-t md:px-5"
              >
                <div className="min-w-0 flex-1 basis-44">
                  <Handle
                    handle={row.handle}
                    name={`${row.posts} approved ${row.posts === 1 ? "post" : "posts"} · ${formatNumber(row.views)} views`}
                    avatar={avatars[row.handle]}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 max-sm:w-full max-sm:flex-nowrap max-sm:justify-between">
                  <Badge tone={statusTone[row.status]}>{row.status}</Badge>
                  <span className="min-w-20 text-right text-base font-medium tracking-tight tabular-nums">
                    {formatMoney(row.amount)}
                  </span>
                  {row.status === "Awaiting approval" ? (
                    <Button
                      size="sm"
                      aria-label={`Approve the payout for @${row.handle}`}
                      onClick={() => {
                        setPending(row);
                        setOpen(true);
                      }}
                    >
                      Approve
                    </Button>
                  ) : (
                    // Holds the button's place so the amounts line up.
                    <span aria-hidden="true" className="w-[76px] max-sm:hidden" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={backdropClass} />
          <Dialog.Popup
            className={cx(
              "fixed rounded-[24px] bg-surface shadow-[0_0_0_1px_var(--color-line),0_24px_60px_-20px_rgb(16_17_20/0.3)] top-1/2 left-1/2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overscroll-contain p-6",
              popupMotionClass,
            )}
          >
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
