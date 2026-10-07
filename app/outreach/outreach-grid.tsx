"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowUpRight } from "lucide-react";
import { Spinner } from "@/components/agent-run";
import { DetailDialog } from "@/components/detail-dialog";
import { Badge, Button, Handle, buttonClass, cardButtonClass } from "@/components/ui";
import type { Outreach } from "@/lib/files";
import { cx, formatCompact } from "@/lib/format";

export type Recipient = { name: string; avatar?: string; followers: number };

const statusTone = {
  "Awaiting approval": "warn",
  Approved: "good",
} as const satisfies Record<Outreach["status"], string>;

// The greeting line says nothing, so the preview starts at the first real
// paragraph of the message.
function preview(message: string) {
  const paragraphs = message.split(/\n+/).filter(Boolean);
  return (paragraphs.length > 1 ? paragraphs.slice(1) : paragraphs).join(" ");
}

export function OutreachGrid({
  outreach,
  people,
}: {
  outreach: Outreach[];
  people: Record<string, Recipient>;
}) {
  const router = useRouter();
  // The chosen draft is kept by handle, so the dialog shows the fresh status
  // after an approval, and stays set while the dialog animates out.
  const [chosen, setChosen] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const approve = async (handle: string) => {
    setSaving(true);
    setProblem(null);
    try {
      const response = await fetch("/api/outreach/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
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

  if (outreach.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-sm font-semibold">No drafts yet</h2>
        <p className="mx-auto mt-1 max-w-[52ch] text-sm text-pretty text-muted">
          Run the Research agent on the Roster screen to find creators, then press Draft outreach
          here. The Sales agent writes one message for each suggested creator.
        </p>
      </div>
    );
  }

  const draft = outreach.find((item) => item.handle === chosen) ?? null;
  const person = draft ? people[draft.handle] : undefined;
  const waiting = outreach.filter((item) => item.status === "Awaiting approval").length;

  return (
    <>
      <p className="text-sm text-muted" aria-live="polite">
        {outreach.length} {outreach.length === 1 ? "draft" : "drafts"},{" "}
        {waiting === 0 ? "all approved" : `${waiting} waiting for approval`}. Open one to read it
        in full.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {outreach.map((item) => (
          <li key={item.handle}>
            <button
              type="button"
              onClick={() => {
                setChosen(item.handle);
                setProblem(null);
                setOpen(true);
              }}
              className={cx(cardButtonClass, "group flex h-full flex-col p-5 text-sm")}
            >
              <Handle
                handle={item.handle}
                name={people[item.handle]?.name}
                avatar={people[item.handle]?.avatar}
              />
              <span className="mt-4 line-clamp-2 font-semibold text-pretty">
                {item.subject}
              </span>
              <span className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed break-words text-muted">
                {preview(item.message)}
              </span>
              <span className="mt-auto flex items-center justify-between gap-2 pt-5">
                <Badge tone={statusTone[item.status]}>{item.status}</Badge>
                <span className="flex items-center gap-1 text-xs font-medium text-faint group-hover:text-ink group-focus-visible:text-ink">
                  Read
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <DetailDialog
        open={open}
        onOpenChange={setOpen}
        title={draft ? `Draft for @${draft.handle}` : "Draft"}
      >
        {draft ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pr-10">
              <Handle
                handle={draft.handle}
                name={
                  person ? `${person.name} · ${formatCompact(person.followers)} followers` : undefined
                }
                avatar={person?.avatar}
              />
              <Badge tone={statusTone[draft.status]}>{draft.status}</Badge>
            </div>

            <div className="rounded-[16px] bg-soft shadow-[0_0_0_1px_var(--color-line)]">
              <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-pretty">
                {draft.subject}
              </h3>
              <p className="px-4 py-3.5 text-sm leading-relaxed break-words whitespace-pre-line">
                {draft.message}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-faint">Why this creator</h3>
              <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">{draft.why}</p>
            </div>

            {problem ? (
              <p role="alert" className="rounded-[14px] bg-bad-soft px-4 py-3 text-sm text-bad">
                {problem}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-4">
              <p className="max-w-[36ch] text-xs text-pretty text-faint">
                {draft.status === "Awaiting approval"
                  ? "Approving does not send anything yet: no message goes to the creator from this screen."
                  : "Approved. Nothing has been sent: no message goes to the creator from this screen."}
              </p>
              <div className="ml-auto flex gap-2">
                <Dialog.Close className={buttonClass()}>Close</Dialog.Close>
                {draft.status === "Awaiting approval" ? (
                  <Button
                    variant="primary"
                    disabled={saving}
                    onClick={() => approve(draft.handle)}
                  >
                    {saving ? <Spinner /> : null}
                    {saving ? "Approving…" : "Approve draft"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </DetailDialog>
    </>
  );
}
