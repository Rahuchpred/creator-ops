import type { ComponentProps, ReactNode } from "react";
import { BadgeCheck, Bot, Lightbulb, Search, Send, type LucideIcon } from "lucide-react";
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
    "press inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "h-8 px-3.5 text-[13px]" : "h-10 px-4.5 text-sm",
    variant === "primary" && "brand-fill",
    variant === "secondary" &&
      "bg-surface text-ink shadow-[0_0_0_1px_var(--color-fill-strong),0_1px_2px_rgb(16_17_20/0.05)] hover:bg-fill",
    variant === "quiet" && "text-muted hover:bg-fill hover:text-ink",
  );

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cx(buttonClass({ variant, size }), className)} {...props} />
  );
}

type Tone = "neutral" | "brand" | "good" | "warn" | "bad";

// Blue is kept for actions, so the brand tone reads as a stronger neutral.
const toneClass: Record<Tone, string> = {
  neutral: "bg-fill text-muted",
  brand: "bg-fill-strong text-ink",
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
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.03em] text-balance md:text-[38px]">
          {title}
        </h1>
        <p className="mt-2.5 max-w-[60ch] text-[15px] leading-relaxed text-muted text-pretty">
          {description}
        </p>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

export type TileColor = "blue" | "green" | "orange" | "pink" | "red" | "violet" | "grey";

const tileSize = {
  sm: "size-7 rounded-[9px] [&>svg]:size-3.5",
  md: "size-10 rounded-[13px] [&>svg]:size-[18px]",
};

export function Tile({
  color,
  size = "md",
  children,
}: {
  color: TileColor;
  size?: keyof typeof tileSize;
  children: ReactNode;
}) {
  return (
    <span aria-hidden="true" className={cx("tile", `tile-${color}`, tileSize[size])}>
      {children}
    </span>
  );
}

const agentLook: Record<string, { color: TileColor; icon: LucideIcon }> = {
  strategy: { color: "blue", icon: Lightbulb },
  research: { color: "green", icon: Search },
  sales: { color: "orange", icon: Send },
  review: { color: "pink", icon: BadgeCheck },
};

// Matched on the start of the name, so Strategist and Strategy share a tile.
// Anyone who is not one of the four agents (a person, the room) gets grey.
export function AgentTile({ agent, size }: { agent: string; size?: keyof typeof tileSize }) {
  const key = Object.keys(agentLook).find((name) => agent.toLowerCase().startsWith(name.slice(0, 5)));
  const { color, icon: Icon } = key ? agentLook[key] : { color: "grey" as const, icon: Bot };
  return (
    <Tile color={color} size={size}>
      <Icon strokeWidth={2.25} />
    </Tile>
  );
}

const pastels = [
  "bg-[#e3edff] text-[#2a54a8]",
  "bg-[#dff5e8] text-[#1c6b47]",
  "bg-[#ffecd6] text-[#94500e]",
  "bg-[#ffe3ef] text-[#a32c63]",
  "bg-[#ebe5ff] text-[#5637b5]",
  "bg-[#fff3c4] text-[#7a5a00]",
];

// The same handle always lands on the same pastel.
const pastelFor = (handle: string) => {
  let sum = 0;
  for (const char of handle) sum = (sum * 31 + char.charCodeAt(0)) % 9973;
  return pastels[sum % pastels.length];
};

export function Handle({ handle, name }: { handle: string; name?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className={cx(
          "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold uppercase",
          pastelFor(handle),
        )}
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
  // relative keeps visually hidden header text inside the scroller on phones.
  wrap: "card relative overflow-x-auto",
  table: "w-full min-w-[680px] border-collapse text-sm",
  th: "h-11 px-5 text-left text-xs font-medium whitespace-nowrap text-faint",
  thRight: "h-11 px-5 text-right text-xs font-medium whitespace-nowrap text-faint",
  row: "border-t border-line",
  td: "h-16 px-5 align-middle",
  tdRight: "h-16 px-5 text-right align-middle whitespace-nowrap tabular-nums",
};
