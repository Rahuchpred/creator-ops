import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/format";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "quiet";
  size?: "sm" | "md";
};

export const buttonClass = ({
  variant = "secondary",
  size = "md",
}: Pick<ButtonProps, "variant" | "size"> = {}) =>
  cx(
    "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium whitespace-nowrap",
    "transition-[background,box-shadow,color] duration-150 select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "h-8 px-3 text-[13px]" : "h-9 px-3.5 text-sm",
    variant === "primary" && "brand-fill",
    variant === "secondary" &&
      "bg-surface text-ink shadow-[0_0_0_1px_rgb(14_21_38/0.1),0_1px_2px_rgb(14_21_38/0.06)] hover:bg-brand-50",
    variant === "quiet" && "text-muted hover:bg-brand-50 hover:text-ink",
  );

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cx(buttonClass({ variant, size }), className)} {...props} />
  );
}

type Tone = "neutral" | "brand" | "good" | "warn" | "bad";

const toneClass: Record<Tone, string> = {
  neutral: "bg-canvas text-muted shadow-[inset_0_0_0_1px_rgb(14_21_38/0.08)]",
  brand: "brand-tint",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-muted text-pretty">{description}</p>
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </header>
  );
}

export function Handle({ handle, name }: { handle: string; name?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="brand-tint grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold uppercase"
      >
        {handle.slice(0, 2)}
      </span>
      <div className="min-w-0">
        <div translate="no" className="truncate font-medium">
          @{handle}
        </div>
        {name ? <div className="truncate text-xs text-faint">{name}</div> : null}
      </div>
    </div>
  );
}

export const tableClass = {
  wrap: "card overflow-x-auto",
  table: "w-full min-w-[680px] border-collapse text-sm",
  th: "h-10 px-4 text-left text-xs font-medium text-faint",
  thRight: "h-10 px-4 text-right text-xs font-medium text-faint",
  row: "border-t border-line",
  td: "h-14 px-4 align-middle",
  tdRight: "h-14 px-4 text-right align-middle tabular-nums",
};
