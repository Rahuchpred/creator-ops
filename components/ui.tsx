import type { ComponentProps, ReactNode } from "react";
import { BadgeCheck, Bot, Lightbulb, Search, Send, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/media";
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

export function Handle({
  handle,
  name,
  avatar,
}: {
  handle: string;
  name?: string;
  avatar?: string;
}) {
  // Spans, so a handle can sit inside a button.
  return (
    <span className="flex min-w-0 items-center gap-3 text-left">
      <Avatar handle={handle} src={avatar} />
      <span className="block min-w-0">
        <span translate="no" className="block truncate font-medium">
          @{handle}
        </span>
        {name ? <span className="block truncate text-xs text-faint">{name}</span> : null}
      </span>
    </span>
  );
}

// The small grey label over a group of things.
export function SectionLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-xs font-medium text-faint">
      {children}
    </h2>
  );
}

const chipColor = {
  violet: "bg-[#ebe5ff] text-[#5637b5]",
  green: "bg-[#dff5e8] text-[#1c6b47]",
  orange: "bg-[#ffecd6] text-[#94500e]",
};

// A compact colored number with a small icon. The label is read out, not shown.
export function Chip({
  color,
  label,
  icon: Icon,
  children,
}: {
  color: keyof typeof chipColor;
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[11px] font-medium whitespace-nowrap tabular-nums",
        chipColor[color],
      )}
    >
      <Icon aria-hidden="true" className="size-3" strokeWidth={2.25} />
      <span className="sr-only">{label}: </span>
      {children}
    </span>
  );
}

// A card that opens something. Hover and keyboard focus look the same: the
// card turns white, lifts a little and its edge darkens. Written out in
// utilities, since the plain .card rule would outrank the hover state.
export const cardButtonClass = cx(
  "w-full cursor-pointer rounded-[20px] bg-soft text-left shadow-[0_0_0_1px_var(--color-line)]",
  "transition-[translate,box-shadow,background-color] duration-150 ease-out motion-reduce:transition-none",
  "hover:-translate-y-0.5 hover:bg-surface hover:shadow-[0_0_0_1px_var(--color-fill-strong),0_14px_28px_-18px_rgb(16_17_20/0.28)]",
  "focus-visible:-translate-y-0.5 focus-visible:bg-surface focus-visible:shadow-[0_0_0_1px_var(--color-fill-strong),0_14px_28px_-18px_rgb(16_17_20/0.28)]",
  "active:translate-y-0 motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0",
);
