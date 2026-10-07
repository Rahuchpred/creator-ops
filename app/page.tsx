import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Check, Eye, Send, Wallet, type LucideIcon } from "lucide-react";
import { BlueField } from "@/components/blue-field";
import { BudgetTracker } from "@/components/budget-tracker";
import { AgentTile, Badge, PageHeader, Tile, buttonClass, type TileColor } from "@/components/ui";
import { totals } from "@/lib/data";
import { formatCompact, formatDollars, formatMoney } from "@/lib/format";
import { budgetFor, sampleLedger } from "@/lib/review/budget";
import { payoutsByApproval } from "@/lib/review/checks";
import {
  getBrief,
  getOutreach,
  getPayoutApprovals,
  getPosts,
  getProgram,
  getRoster,
  missingResearchKeys,
  missingReviewKeys,
  missingSalesKeys,
  missingStrategyKeys,
} from "@/lib/store";

const agents = [
  { name: "Strategy", job: "Writes the brief" },
  { name: "Research", job: "Fills the roster" },
  { name: "Sales", job: "Drafts outreach" },
  { name: "Marketing", job: "Checks posts and sets payouts" },
];

const missingKeys: Record<string, () => string[]> = {
  Strategy: missingStrategyKeys,
  Research: missingResearchKeys,
  Sales: missingSalesKeys,
  Marketing: missingReviewKeys,
};

// Checked per request, so the badge flips as soon as the keys are in place.
async function AgentStatus({ agent }: { agent: string }) {
  await connection();
  return missingKeys[agent]().length === 0 ? (
    <Badge tone="good">Ready</Badge>
  ) : (
    <Badge>Needs keys</Badge>
  );
}

// The order a new program is worked through, one screen at a time.
const startHere = [
  { label: "Setup", href: "/program" },
  { label: "Brief", href: "/brief" },
  { label: "Roster", href: "/roster" },
  { label: "Outreach", href: "/outreach" },
  { label: "Posts", href: "/posts" },
  { label: "Payouts", href: "/payouts" },
];

type Waiting = { icon: LucideIcon; color: TileColor; text: string; href: string; action: string };

const plural = (count: number, one: string, many: string) =>
  count === 1 ? `1 ${one}` : `${count} ${many}`;

// Read per request, so a program or a result saved a moment ago shows on
// refresh.
async function Overview() {
  const [{ brand, sample }, brief, roster, outreach, reviewed, approvals] = await Promise.all([
    getProgram(),
    getBrief(),
    getRoster(),
    getOutreach(),
    getPosts(),
    getPayoutApprovals(),
  ]);

  // Sample rows stand in for a roster or posts that were never saved.
  const creators = roster.sample ? [] : roster.creators;
  const posts = reviewed.sample ? [] : reviewed.posts;
  const hasResults = creators.length > 0 || outreach.length > 0 || posts.length > 0;
  // The made-up numbers show only for the sample program with nothing saved.
  const sampleNumbers = sample && !hasResults && brief?.writtenBy !== "Strategy agent";

  const payouts = payoutsByApproval(posts, approvals);
  const views = posts
    .filter((post) => post.status === "Approved")
    .reduce((sum, post) => sum + post.views, 0);
  const earned = [...payouts.waiting, ...payouts.approved].reduce(
    (sum, payout) => sum + payout.amount,
    0,
  );
  // The month is read after the saved data, so it is today's on every request.
  const month = new Date().toISOString().slice(0, 7);
  const ledger = sampleNumbers ? sampleLedger(month) : budgetFor(posts, approvals, brand, month);
  const share = (spend: number) => `${Math.round((spend / brand.monthlyBudget) * 100)}%`;

  const stats = sampleNumbers
    ? [
        { label: "Approved views", value: formatCompact(totals.views) },
        { label: "Earned by creators", value: formatDollars(totals.spend) },
        { label: "Creators onboarded", value: String(totals.onboarded) },
        { label: "Budget used", value: share(totals.spend) },
      ]
    : [
        { label: "Approved views", value: formatCompact(views) },
        { label: "Earned by creators", value: formatDollars(earned) },
        {
          label: "Creators suggested",
          value: String(creators.filter((creator) => creator.status === "Suggested").length),
        },
        { label: "Budget used", value: share(earned) },
      ];

  const drafts = outreach.filter((draft) => draft.status === "Awaiting approval").length;
  const held = posts.filter((post) => post.status === "In review").length;
  const unpaid = payouts.waiting.length;

  const needsYou: Waiting[] = sampleNumbers
    ? [
        {
          icon: Wallet,
          color: "violet",
          text: `${plural(totals.awaitingApproval, "payout is", "payouts are")} waiting for approval`,
          href: "/payouts",
          action: "Review payouts",
        },
        {
          icon: Eye,
          color: "red",
          text: `${plural(totals.flaggedPosts, "post has", "posts have")} views that look unusual`,
          href: "/posts",
          action: "Open posts",
        },
      ]
    : [
        drafts > 0 && {
          icon: Send,
          color: "orange" as const,
          text: `${plural(drafts, "outreach draft is", "outreach drafts are")} waiting for approval`,
          href: "/outreach",
          action: "Read drafts",
        },
        held > 0 && {
          icon: Eye,
          color: "red" as const,
          text: `${plural(held, "post is", "posts are")} in review and ${held === 1 ? "needs" : "need"} your call`,
          href: "/posts",
          action: "Open posts",
        },
        unpaid > 0 && {
          icon: Wallet,
          color: "violet" as const,
          text: `${plural(unpaid, "payout is", "payouts are")} waiting for approval`,
          href: "/payouts",
          action: "Review payouts",
        },
      ].filter((item) => item !== false);

  return (
    <>
      <PageHeader title={brand.name} description={brand.product}>
        {sampleNumbers ? <Badge>Sample numbers</Badge> : sample ? <Badge>Sample program</Badge> : null}
        <Link href="/program" className={buttonClass()}>
          {sample ? "Set Up Your Program" : "Edit Program"}
        </Link>
      </PageHeader>

      <section
        aria-label="This month"
        className="brand-field relative overflow-hidden rounded-[24px] text-white"
      >
        <BlueField className="absolute inset-0 size-full" />
        <dl className="relative grid grid-cols-2 gap-x-6 gap-y-8 p-6 md:grid-cols-4 md:p-9">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-white/85">{stat.label}</dt>
              <dd className="text-3xl font-medium tracking-[-0.03em] tabular-nums md:text-[40px] md:leading-none">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <BudgetTracker ledger={ledger} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="card p-6" aria-labelledby="needs-you">
          <h2 id="needs-you" className="text-base font-semibold tracking-tight">
            {sampleNumbers || hasResults ? "Needs you" : "Start here"}
          </h2>
          {sampleNumbers || hasResults ? (
            <ul className="mt-3 flex flex-col">
              {needsYou.map((item, index) => (
                <li
                  key={item.href}
                  className="flex flex-wrap items-center gap-3 border-t border-line py-3.5"
                >
                  <Tile color={item.color}>
                    <item.icon strokeWidth={2.25} />
                  </Tile>
                  <span className="min-w-0 flex-1 basis-40 text-sm text-pretty">{item.text}</span>
                  <Link
                    href={item.href}
                    className={buttonClass({
                      variant: index === 0 ? "primary" : "secondary",
                      size: "sm",
                    })}
                  >
                    {item.action}
                  </Link>
                </li>
              ))}
              {needsYou.length === 0 ? (
                <li className="flex items-center gap-3 border-t border-line py-3.5">
                  <Tile color="green">
                    <Check strokeWidth={2.25} />
                  </Tile>
                  <span className="text-sm text-pretty">Nothing is waiting for you right now.</span>
                </li>
              ) : null}
            </ul>
          ) : (
            <>
              <p className="mt-1 text-sm text-pretty text-muted">
                This program has no results yet. Work through the screens in this order.
              </p>
              <ol className="mt-4 flex flex-wrap gap-2">
                {startHere.map((step, index) => (
                  <li key={step.href}>
                    <Link href={step.href} className={buttonClass({ size: "sm" })}>
                      <span className="text-faint tabular-nums">{index + 1}</span>
                      {step.label}
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <section className="card p-6" aria-labelledby="agents">
          <h2 id="agents" className="text-base font-semibold tracking-tight">
            Agents
          </h2>
          <ul className="mt-3 flex flex-col">
            {agents.map((agent) => (
              <li
                key={agent.name}
                className="flex items-center gap-3 border-t border-line py-3.5 text-sm"
              >
                <AgentTile agent={agent.name} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{agent.name}</span>
                  <span className="block truncate text-[13px] text-muted">{agent.job}</span>
                </span>
                <Suspense fallback={<Badge>Checking…</Badge>}>
                  <AgentStatus agent={agent.name} />
                </Suspense>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-6" aria-labelledby="program">
        <h2 id="program" className="text-base font-semibold tracking-tight">
          Program
        </h2>
        <dl className="mt-3 grid gap-x-8 text-sm md:grid-cols-2">
          {[
            ["Audience", brand.audience],
            ["Monthly budget", formatDollars(brand.monthlyBudget)],
            ["Pay per 1,000 views", formatMoney(brand.ratePerThousandViews)],
            ["Most a single post can earn", formatDollars(brand.payoutCapPerPost)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-6 border-t border-line py-3">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mt-5 text-xs font-medium text-faint">Rules every post follows</h3>
        <ul className="mt-2 grid gap-x-8 text-sm md:grid-cols-2">
          {brand.rules.map((rule) => (
            <li key={rule} className="border-t border-line py-3 text-pretty">
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-muted">
          Loading the program…
        </p>
      }
    >
      <Overview />
    </Suspense>
  );
}
