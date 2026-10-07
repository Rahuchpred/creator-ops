import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { cx } from "@/lib/format";
import type { Trust, TrustLevel } from "@/lib/review/trust";

const look = {
  Trusted: { tone: "bg-good-soft text-good", icon: ShieldCheck },
  Watch: { tone: "bg-warn-soft text-warn", icon: ShieldAlert },
  "At risk": { tone: "bg-bad-soft text-bad", icon: ShieldX },
  Banned: { tone: "bg-bad-soft text-bad", icon: ShieldX },
} as const satisfies Record<TrustLevel, unknown>;

// A creator's trust score as a small pill: an icon, the score, and the level
// in words so it does not rest on color.
export function TrustBadge({ trust }: { trust: Trust }) {
  const { tone, icon: Icon } = look[trust.level];
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap tabular-nums",
        tone,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
      <span className="sr-only">Trust score </span>
      {trust.score}
      <span className="sr-only"> of 100, </span>
      <span>{trust.level}</span>
    </span>
  );
}

// Why the score is what it is, one plain line per reason.
export function TrustReasons({ trust, className }: { trust: Trust; className?: string }) {
  if (trust.reasons.length === 0) {
    return (
      <p className={cx("text-[13px] text-pretty text-muted", className)}>
        No warning signs on {trust.posts === 1 ? "their 1 program post" : `their ${trust.posts} program posts`}.
      </p>
    );
  }
  return (
    <ul className={cx("flex flex-col gap-1 text-[13px] text-pretty text-muted", className)}>
      {trust.reasons.map((reason) => (
        <li key={reason.text} className="flex gap-2">
          <span className="w-8 shrink-0 font-medium text-ink tabular-nums">
            <span aria-hidden="true">-{reason.points}</span>
            <span className="sr-only">Minus {reason.points} points: </span>
          </span>
          <span className="min-w-0">{reason.text}.</span>
        </li>
      ))}
    </ul>
  );
}
