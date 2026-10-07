"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cx } from "@/lib/format";

const width = {
  md: "w-[min(560px,calc(100vw-32px))]",
  lg: "w-[min(760px,calc(100vw-32px))]",
};

// The shared shell for opening one item from a grid or a list: a centered
// panel that scrolls inside itself, with a close button in the corner.
export function DetailDialog({
  open,
  onOpenChange,
  title,
  size = "md",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Read out as the dialog's name. The visible heading is up to the content.
  title: string;
  size?: keyof typeof width;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup
          className={cx(
            "fixed top-1/2 left-1/2 max-h-[calc(100dvh-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_var(--color-line),0_24px_60px_-20px_rgb(16_17_20/0.3)] transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none md:p-7",
            width[size],
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            className="press absolute top-3.5 right-3.5 grid size-9 place-items-center rounded-full text-muted hover:bg-fill hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </Dialog.Close>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// A small labelled number, used in rows of two or three inside a dialog.
export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-0.5 rounded-[14px] bg-soft px-3.5 py-3 shadow-[0_0_0_1px_var(--color-line)]">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="text-base font-medium tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}
