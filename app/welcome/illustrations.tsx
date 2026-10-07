import type { ReactNode } from "react";
import {
  Clapperboard,
  Eye,
  FileText,
  LayoutGrid,
  Link2,
  Send,
  Users,
  Wallet,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Avatar } from "@/components/media";
import { AgentTile, Badge, Tile, buttonClass } from "@/components/ui";
import { cx } from "@/lib/format";

// Drawings of the product, built from the app's own parts. Each one is a
// single image to a screen reader, and nothing inside can be pressed. The
// handles and numbers are placeholders, and the page says so.

// An app window: a title bar with three dots, then the screen.
function Window({
  label,
  title,
  className,
  children,
}: {
  label: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cx(
        "w-full overflow-hidden rounded-[18px] bg-surface text-[13px] select-none",
        "shadow-[0_0_0_1px_rgb(16_17_20/0.06),0_24px_48px_-28px_rgb(16_17_20/0.35)]",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-1.5 border-b border-line px-4">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-2.5 rounded-full bg-fill-strong" />
        ))}
        <span className="ml-2 text-xs font-medium text-faint">{title}</span>
        <span className="ml-auto">
          <Badge>Sample data</Badge>
        </span>
      </div>
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

const screens = [
  { icon: LayoutGrid, label: "Overview" },
  { icon: FileText, label: "Brief" },
  { icon: Users, label: "Roster" },
  { icon: Send, label: "Outreach" },
  { icon: Clapperboard, label: "Posts" },
  { icon: Wallet, label: "Payouts" },
];

const waiting = [
  { icon: Send, color: "orange", text: "3 outreach drafts are waiting for approval", action: "Read Drafts" },
  { icon: Eye, color: "red", text: "2 posts are in review and need your call", action: "Open Posts" },
  { icon: Wallet, color: "violet", text: "4 payouts are waiting for approval", action: "Review Payouts" },
] as const;

const team = ["Strategy", "Research", "Sales", "Marketing"];

export function ProductWindow() {
  return (
    <Window
      title="Creator Ops"
      label="Sample of the product's Overview: outreach drafts, posts in review and payouts, each waiting for a person to approve."
      className="rounded-[22px] shadow-[0_0_0_1px_rgb(16_17_20/0.06),0_32px_64px_-28px_rgb(14_21_38/0.6)]"
    >
      <div className="flex">
        <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-line p-3 md:flex">
          <span className="flex items-center gap-2 px-2 pt-1 pb-3 font-semibold">
            <LogoMark className="size-4" />
            Creator Ops
          </span>
          {screens.map((screen, index) => (
            <span
              key={screen.label}
              className={cx(
                "flex h-8 items-center gap-2.5 rounded-full px-3",
                index === 0 ? "bg-fill font-medium" : "text-muted",
              )}
            >
              <screen.icon className="size-3.5" strokeWidth={2} />
              {screen.label}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <span className="block text-xl font-medium tracking-[-0.02em]">Needs you</span>
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
          <ul className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {team.map((agent) => (
              <li key={agent} className="flex items-center gap-2.5 rounded-2xl bg-soft p-2.5">
                <AgentTile agent={agent} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{agent}</span>
                  <span className="block text-xs text-faint">Done</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Window>
  );
}

const briefParts = [
  { title: "What to film", bars: ["w-full", "w-4/5"] },
  { title: "Rules every post follows", bars: ["w-3/4", "w-2/3", "w-1/2"] },
];

export function BriefWindow() {
  return (
    <Window title="Brief" label="Sample brief: what to film, the rules, and references with links.">
      <div className="flex flex-col gap-5 p-5">
        {briefParts.map((part) => (
          <div key={part.title}>
            <span className="block font-semibold">{part.title}</span>
            <span className="mt-2.5 flex flex-col gap-2">
              {part.bars.map((width, index) => (
                <Bar key={index} className={width} />
              ))}
            </span>
          </div>
        ))}
        <div>
          <span className="block font-semibold">References</span>
          <ul className="mt-1 flex flex-col">
            {["w-2/5", "w-1/2"].map((width) => (
              <li key={width} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                <Link2 className="size-4 shrink-0 text-faint" strokeWidth={2} />
                <span className="min-w-0 flex-1">
                  <Bar className={width} />
                </span>
                <Badge tone="good">Page read</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Window>
  );
}

const creators = [
  { handle: "ava_sample", note: "Score 82", badge: "Shortlist", tone: "good" },
  { handle: "mia_sample", note: "Score 77", badge: "Shortlist", tone: "good" },
  { handle: "kai_sample", note: "Rejected", badge: "View spike", tone: "bad" },
  { handle: "leo_sample", note: "Rejected", badge: "Low engagement", tone: "bad" },
] as const;

export function RosterWindow() {
  return (
    <Window
      title="Roster"
      label="Sample roster: two creators shortlisted with scores, two rejected for a view spike and low engagement."
    >
      <ul className="flex flex-col px-5 py-2">
        {creators.map((creator) => (
          <li
            key={creator.handle}
            className="flex items-center gap-3 border-b border-line py-3 last:border-0"
          >
            <Avatar handle={creator.handle} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">@{creator.handle}</span>
              <span className="block text-xs text-faint tabular-nums">{creator.note}</span>
            </span>
            <Badge tone={creator.tone}>{creator.badge}</Badge>
          </li>
        ))}
      </ul>
    </Window>
  );
}

export function OutreachWindow() {
  return (
    <Window
      title="Outreach"
      label="Sample outreach: one draft waiting for a person to approve it, one already approved."
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="rounded-2xl bg-soft p-4 shadow-[0_0_0_1px_var(--color-line)]">
          <div className="flex items-center gap-2.5">
            <Avatar handle="ava_sample" />
            <span className="min-w-0 flex-1 truncate font-medium">To @ava_sample</span>
            <Badge tone="warn">Awaiting approval</Badge>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Bar className="w-full" />
            <Bar className="w-11/12" />
            <Bar className="w-2/3" />
          </div>
          <div className="mt-4 flex gap-2">
            <FakeButton primary>Approve</FakeButton>
            <FakeButton>Edit</FakeButton>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl bg-soft p-4 shadow-[0_0_0_1px_var(--color-line)]">
          <Avatar handle="mia_sample" />
          <span className="min-w-0 flex-1 truncate font-medium">To @mia_sample</span>
          <Badge tone="good">Approved</Badge>
        </div>
      </div>
    </Window>
  );
}

const posts = [
  { handle: "ava_sample", badges: [["warn", "In review"], ["bad", "View spike"]], score: 71, payout: "$48.00", payoutLabel: "Payout if real" },
  { handle: "mia_sample", badges: [["good", "Approved"]], score: 88, payout: "$31.50", payoutLabel: "Payout" },
] as const;

export function PostsWindow() {
  return (
    <Window
      title="Posts"
      label="Sample posts: one approved with its payout, one held in review for a view spike."
    >
      <ul className="flex flex-col px-5 py-2">
        {posts.map((post) => (
          <li key={post.handle} className="flex gap-3.5 border-b border-line py-4 last:border-0">
            <span className="grid h-[104px] w-[62px] shrink-0 place-items-center rounded-xl bg-fill text-faint">
              <Clapperboard className="size-5 opacity-60" strokeWidth={1.6} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="truncate font-medium">@{post.handle}</span>
              <div className="flex flex-wrap gap-1.5">
                {post.badges.map(([tone, text]) => (
                  <Badge key={text} tone={tone}>
                    {text}
                  </Badge>
                ))}
              </div>
              <dl className="mt-auto grid grid-cols-2 gap-x-3 text-xs">
                <div>
                  <dt className="text-faint">Brief score</dt>
                  <dd className="font-medium tabular-nums">{post.score}</dd>
                </div>
                <div>
                  <dt className="text-faint">{post.payoutLabel}</dt>
                  <dd className="font-medium tabular-nums">{post.payout}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </Window>
  );
}

// The three small drawings on the trust cards.

export function FormulaSketch() {
  return (
    <div
      role="img"
      aria-label="Sample payout sum: 48,000 views at $1.00 per 1,000 views is $48.00."
      className="rounded-2xl bg-surface p-4 font-mono text-[13px] shadow-[0_0_0_1px_var(--color-line)] select-none"
    >
      <span className="block text-faint">views / 1,000 x rate</span>
      <span className="mt-2 block tabular-nums">48,000 / 1,000 x $1.00</span>
      <span className="mt-2 block border-t border-line pt-2 font-medium tabular-nums">= $48.00</span>
    </div>
  );
}

const gates = [
  { icon: Send, color: "orange", text: "Outreach" },
  { icon: Eye, color: "red", text: "Posts held in review" },
  { icon: Wallet, color: "violet", text: "Payouts" },
] as const;

export function ApprovalSketch() {
  return (
    <ul
      role="img"
      aria-label="The three things a person approves: outreach, posts held in review, and payouts."
      className="flex flex-col rounded-2xl bg-surface px-4 py-1.5 text-[13px] shadow-[0_0_0_1px_var(--color-line)] select-none"
    >
      {gates.map((gate) => (
        <li key={gate.text} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
          <Tile color={gate.color} size="sm">
            <gate.icon strokeWidth={2.25} />
          </Tile>
          <span className="min-w-0 flex-1 font-medium">{gate.text}</span>
          <Badge tone="warn">Waits for you</Badge>
        </li>
      ))}
    </ul>
  );
}

// The names the Research agent's checks use in the product.
const flags = ["View spike", "Low engagement", "Inactive audience", "Odd comment ratio", "Follow for follow"];

export function FlagSketch() {
  return (
    <div
      role="img"
      aria-label={`The fraud checks by name: ${flags.join(", ")}.`}
      className="flex flex-wrap gap-1.5 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--color-line)] select-none"
    >
      {flags.map((flag) => (
        <Badge key={flag} tone="bad">
          {flag}
        </Badge>
      ))}
    </div>
  );
}
