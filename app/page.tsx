import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Eye, Wallet } from "lucide-react";
import { BlueField } from "@/components/blue-field";
import { AgentTile, Badge, PageHeader, Tile, buttonClass } from "@/components/ui";
import { totals } from "@/lib/data";
import { formatCompact, formatDollars, formatMoney } from "@/lib/format";
import { getProgram, missingStrategyKeys } from "@/lib/store";

const agents = [
  { name: "Strategy", job: "Writes the brief" },
  { name: "Research", job: "Fills the roster" },
  { name: "Sales", job: "Drafts outreach" },
  { name: "Review", job: "Scores posts and payouts" },
];

// Checked per request, so the badge flips as soon as the keys are in place.
async function StrategyStatus() {
  await connection();
  return missingStrategyKeys().length === 0 ? (
    <Badge tone="good">Ready</Badge>
  ) : (
    <Badge>Needs keys</Badge>
  );
}

// Read per request, so a program saved a moment ago shows on refresh.
async function Overview() {
  const { brand, sample } = await getProgram();
  const spentShare = Math.round((totals.spend / brand.monthlyBudget) * 100);

  const stats = [
    { label: "Approved views", value: formatCompact(totals.views) },
    { label: "Earned by creators", value: formatDollars(totals.spend) },
    { label: "Creators onboarded", value: String(totals.onboarded) },
    { label: "Budget used", value: `${spentShare}%` },
  ];

  return (
    <>
      <PageHeader title={brand.name} description={brand.product}>
        <Badge>{sample ? "Sample program" : "Sample numbers"}</Badge>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="card p-6" aria-labelledby="needs-you">
          <h2 id="needs-you" className="text-base font-semibold tracking-tight">
            Needs you
          </h2>
          <ul className="mt-3 flex flex-col">
            <li className="flex flex-wrap items-center gap-3 border-t border-line py-3.5">
              <Tile color="violet">
                <Wallet strokeWidth={2.25} />
              </Tile>
              <span className="min-w-0 flex-1 basis-40 text-sm text-pretty">
                {totals.awaitingApproval} payouts are waiting for approval
              </span>
              <Link href="/payouts" className={buttonClass({ variant: "primary", size: "sm" })}>
                Review payouts
              </Link>
            </li>
            <li className="flex flex-wrap items-center gap-3 border-t border-line py-3.5">
              <Tile color="red">
                <Eye strokeWidth={2.25} />
              </Tile>
              <span className="min-w-0 flex-1 basis-40 text-sm text-pretty">
                {totals.flaggedPosts === 1
                  ? "1 post has views that look unusual"
                  : `${totals.flaggedPosts} posts have views that look unusual`}
              </span>
              <Link href="/posts" className={buttonClass({ size: "sm" })}>
                Open posts
              </Link>
            </li>
          </ul>
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
                {agent.name === "Strategy" ? (
                  <Suspense fallback={<Badge>Checking…</Badge>}>
                    <StrategyStatus />
                  </Suspense>
                ) : (
                  <Badge>Not connected</Badge>
                )}
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
