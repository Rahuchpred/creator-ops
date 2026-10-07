import type { ReactNode } from "react";
import { Clapperboard, Eye, Send, Wallet } from "lucide-react";
import { Avatar } from "@/components/media";
import { Badge, Tile, buttonClass } from "@/components/ui";
import { cx } from "@/lib/format";

// Small drawings of the product, built from the app's own parts. Each one is
// a single image to a screen reader, and nothing inside can be pressed. The
// handles and numbers are placeholders, and the page says so.

function Frame({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cx(
        "rounded-2xl bg-surface p-4 text-[13px] shadow-[0_0_0_1px_var(--color-line)] select-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

// A grey bar standing in for a line of text.
const Bar = ({ className }: { className: string }) => (
  <span className={cx("block h-2 rounded-full bg-fill-strong", className)} />
);

// Looks like the app's button, but is only a picture of one.
const FakeButton = ({ primary, children }: { primary?: boolean; children: ReactNode }) => (
  <span
    className={cx(
      buttonClass({ variant: primary ? "primary" : "secondary", size: "sm" }),
      "pointer-events-none",
    )}
  >
    {children}
  </span>
);

const waiting = [
  { icon: Send, color: "orange", text: "3 outreach drafts are waiting for approval", action: "Read Drafts" },
  { icon: Eye, color: "red", text: "2 posts are in review and need your call", action: "Open Posts" },
  { icon: Wallet, color: "violet", text: "4 payouts are waiting for approval", action: "Review Payouts" },
] as const;

export function NeedsYouPreview() {
  return (
    <Frame
      label="Sample of the product's Overview: outreach drafts, posts in review and payouts, each waiting for a person to approve."
      className="rounded-[22px] p-5 shadow-[0_0_0_1px_rgb(16_17_20/0.06),0_24px_48px_-24px_rgb(14_21_38/0.55)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold tracking-tight">Needs you</span>
        <Badge>Sample data</Badge>
      </div>
      <ul className="mt-3 flex flex-col">
        {waiting.map((item, index) => (
          <li key={item.action} className="flex items-center gap-3 border-t border-line py-3">
            <Tile color={item.color}>
              <item.icon strokeWidth={2.25} />
            </Tile>
            <span className="min-w-0 flex-1 text-sm text-pretty">{item.text}</span>
            <span className="hidden sm:block">
              <FakeButton primary={index === 0}>{item.action}</FakeButton>
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function BriefSketch() {
  return (
    <Frame label="Sample brief: what to film, the rules, and references with links.">
      <span className="font-semibold">Creator brief</span>
      <ul className="mt-3 flex flex-col gap-3">
        {[
          ["What to film", "w-4/5"],
          ["Rules every post follows", "w-3/5"],
          ["References, each with a link", "w-2/3"],
        ].map(([line, width]) => (
          <li key={line}>
            <span className="block text-xs text-muted">{line}</span>
            <Bar className={cx("mt-1.5", width)} />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function RosterSketch() {
  return (
    <Frame label="Sample roster: one creator shortlisted with a score, one rejected for a view spike.">
      <ul className="flex flex-col">
        <li className="flex items-center gap-2.5 pb-3">
          <Avatar handle="ava_sample" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">@ava_sample</span>
            <span className="block text-xs text-faint tabular-nums">Score 82</span>
          </span>
          <Badge tone="good">Shortlist</Badge>
        </li>
        <li className="flex items-center gap-2.5 border-t border-line pt-3">
          <Avatar handle="kai_sample" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">@kai_sample</span>
            <span className="block text-xs text-faint">Rejected</span>
          </span>
          <Badge tone="bad">View spike</Badge>
        </li>
      </ul>
    </Frame>
  );
}

export function OutreachSketch() {
  return (
    <Frame label="Sample outreach draft, waiting for a person to approve it.">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">To @ava_sample</span>
        <Badge tone="warn">Awaiting approval</Badge>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Bar className="w-full" />
        <Bar className="w-11/12" />
        <Bar className="w-2/3" />
      </div>
      <div className="mt-4 flex gap-2">
        <FakeButton primary>Approve</FakeButton>
        <FakeButton>Edit</FakeButton>
      </div>
    </Frame>
  );
}

export function PostSketch() {
  return (
    <Frame label="Sample reviewed post: a brief score, a view spike flag, held in review with a worked-out payout.">
      <div className="flex gap-3.5">
        <span className="grid h-[104px] w-[62px] shrink-0 place-items-center rounded-xl bg-fill text-faint">
          <Clapperboard className="size-5 opacity-60" strokeWidth={1.6} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate font-medium">@ava_sample</span>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="warn">In review</Badge>
            <Badge tone="bad">View spike</Badge>
          </div>
          <dl className="mt-auto grid grid-cols-2 gap-x-3 text-xs">
            <div>
              <dt className="text-faint">Brief score</dt>
              <dd className="font-medium tabular-nums">71</dd>
            </div>
            <div>
              <dt className="text-faint">Payout if real</dt>
              <dd className="font-medium tabular-nums">$48.00</dd>
            </div>
          </dl>
        </div>
      </div>
    </Frame>
  );
}
