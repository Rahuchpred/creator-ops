"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Spinner } from "@/components/agent-run";
import { Badge, Button, Handle, buttonClass } from "@/components/ui";
import type { Outreach } from "@/lib/files";

const statusTone = {
  "Awaiting approval": "warn",
  Approved: "brand",
} as const satisfies Record<Outreach["status"], string>;

export function OutreachList({ outreach }: { outreach: Outreach[] }) {
  const router = useRouter();
  // The chosen draft stays set while the dialog animates out, so its text does
  // not blank mid-close.
  const [pending, setPending] = useState<Outreach | null>(null);
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

  return (
    <>
      <ul className="flex flex-col gap-4">
        {outreach.map((draft) => (
          <li key={draft.handle} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Handle handle={draft.handle} />
              <div className="flex items-center gap-2">
                <Badge tone={statusTone[draft.status]}>{draft.status}</Badge>
                {draft.status === "Awaiting approval" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setPending(draft);
                      setProblem(null);
                      setOpen(true);
                    }}
                  >
                    Approve
                  </Button>
                ) : null}
              </div>
            </div>
            <h2 className="mt-4 text-sm font-semibold text-pretty">{draft.subject}</h2>
            <p className="mt-2 max-w-[70ch] text-sm break-words whitespace-pre-line">
              {draft.message}
            </p>
            <p className="mt-4 border-t border-line pt-3 text-xs text-pretty text-faint">
              Why this creator: {draft.why}
            </p>
          </li>
        ))}
      </ul>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
          <Dialog.Popup className="card fixed top-1/2 left-1/2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overscroll-contain p-6 transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <Dialog.Title className="text-lg font-semibold tracking-tight">
              Approve the draft for @{pending?.handle ?? ""}?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-pretty text-muted">
              This marks the message as approved. Approving does not send anything yet: no message
              goes to the creator from this screen.
            </Dialog.Description>
            {problem ? (
              <p role="alert" className="mt-3 rounded-[10px] bg-bad-soft p-3 text-sm text-bad">
                {problem}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close className={buttonClass()}>Cancel</Dialog.Close>
              <Button
                variant="primary"
                disabled={saving}
                onClick={() => pending && approve(pending.handle)}
              >
                {saving ? <Spinner /> : null}
                {saving ? "Approving…" : "Approve draft"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
