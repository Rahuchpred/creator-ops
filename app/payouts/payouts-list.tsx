"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Spinner } from "@/components/agent-run";
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

// A payout row, with the posts and amounts it stands for. Sample rows have
// none.
export type PayoutRow = Payout & { items?: { postId: string; amount: number }[] };

export function PayoutsList({
  payouts,
  avatars,
  sample,
}: {
  payouts: PayoutRow[];
  avatars: Record<string, string>;
  sample: boolean;
}) {
  const router = useRouter();
  // Real approvals are saved and come back with the rows. Only the sample
  // rows, which belong to no saved post, are approved in memory.
  const [approved, setApproved] = useState<string[]>([]);
  // The chosen rows stay set while the dialog animates out, so its text does
  // not blank mid-close.
  const [pending, setPending] = useState<PayoutRow[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const rows = payouts.map((payout) =>
    sample && approved.includes(payout.handle)
      ? { ...payout, status: "Approved" as const }
      : payout,
  );
  const waiting = rows.filter((row) => row.status === "Awaiting approval");
  const settled = rows.filter((row) => row.status !== "Awaiting approval");
  const total = (list: Payout[]) => list.reduce((sum, row) => sum + row.amount, 0);

  const ask = (list: PayoutRow[]) => {
    setPending(list);
    setProblem(null);
    setOpen(true);
  };

  const approve = async () => {
    if (sample) {
      setApproved((current) => [...new Set([...current, ...pending.map((row) => row.handle)])]);
      setOpen(false);
      return;
    }
    setSaving(true);
    setProblem(null);
    try {
      const response = await fetch("/api/payouts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvals: pending.flatMap((row) => row.items ?? []) }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setProblem(body?.message ?? "The approval was not saved. Try again.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setProblem("Could not reach the app. Check that it is running and try again.");
    } finally {
      setSaving(false);
    }
  };

  const one = pending.length === 1 ? pending[0] : null;

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
            onClick={() => ask(waiting)}
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
                key={`${row.handle}-${row.status}`}
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
                      onClick={() => ask([row])}
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
              Approve {formatMoney(total(pending))}?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-pretty text-muted">
              {one
                ? `This marks @${one.handle} as approved for ${one.posts} ${one.posts === 1 ? "post" : "posts"} and ${formatNumber(one.views)} views. No money moves from this screen.`
                : `This marks all ${pending.length} waiting payouts as approved, one for each creator. No money moves from this screen.`}
            </Dialog.Description>
            {problem ? (
              <p role="alert" className="mt-4 rounded-[14px] bg-bad-soft px-4 py-3 text-sm text-bad">
                {problem}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close className={buttonClass()}>Cancel</Dialog.Close>
              <Button variant="primary" disabled={saving || pending.length === 0} onClick={approve}>
                {saving ? <Spinner /> : null}
                {saving ? "Approving…" : one ? "Approve payout" : "Approve all"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
