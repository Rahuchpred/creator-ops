import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code,
  Eye,
  FileText,
  ListChecks,
  MessagesSquare,
  Minus,
  Send,
  ShieldAlert,
  Table,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { BlueField } from "@/components/blue-field";
import { LogoMark } from "@/components/logo";
import { AgentTile, Badge, Tile, buttonClass, type TileColor } from "@/components/ui";
import { cx } from "@/lib/format";
import {
  BriefSketch,
  NeedsYouPreview,
  OutreachSketch,
  PostSketch,
  RosterSketch,
} from "./illustrations";

export const metadata: Metadata = {
  title: "AI agents that run your creator program",
  description:
    "Creator Ops is a company run by AI agents. It runs pay-per-view creator programs for consumer brands: the brief, the creators, the outreach, the video checks and the payouts. A person approves outreach and payouts.",
};

const container = "mx-auto w-full max-w-6xl px-4 md:px-8";
const h2Class =
  "text-[30px] leading-[1.08] font-medium tracking-[-0.03em] text-balance md:text-[44px]";
const leadClass = "text-base leading-relaxed text-muted text-pretty md:text-[17px]";
const bigButton = "h-12 px-6 text-[15px]";

const nav = [
  { label: "How It Works", href: "#how" },
  { label: "Trust", href: "#trust" },
  { label: "Pricing", href: "#pricing" },
];

function Cta({ className, big = true }: { className?: string; big?: boolean }) {
  return (
    <div className={cx("flex flex-wrap gap-3", className)}>
      <Link href="/" className={cx(buttonClass({ variant: "primary" }), big && bigButton)}>
        Try the Product
        <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} />
      </Link>
      <Link href="/ask" className={cx(buttonClass(), big && bigButton)}>
        Ask the AI Team
      </Link>
    </div>
  );
}

const chores: { icon: LucideIcon; text: string }[] = [
  { icon: FileText, text: "Write the brief" },
  { icon: Users, text: "Recruit the creators" },
  { icon: Eye, text: "Check every video" },
  { icon: Table, text: "Count the views" },
  { icon: Wallet, text: "Build the payout sheet" },
];

type Employee = {
  name: string;
  job: string;
  approval?: string;
  sketch: ReactNode;
  span: string;
};

const employees: Employee[] = [
  {
    name: "Strategy",
    job: "Writes the creator brief from what is working in the niche. Each reference links to a page it read.",
    sketch: <BriefSketch />,
    span: "lg:col-span-3",
  },
  {
    name: "Research",
    job: "Finds creators on TikTok, checks their real numbers and scores them. Flags accounts whose views look fake.",
    sketch: <RosterSketch />,
    span: "lg:col-span-3",
  },
  {
    name: "Sales",
    job: "Drafts one outreach message per creator. Nothing is sent until a person approves it.",
    approval: "You approve",
    sketch: <OutreachSketch />,
    span: "lg:col-span-3",
  },
  {
    name: "Marketing",
    job: "Runs the content, since the creators' videos are the marketing. Scores each posted video against the brief, flags missing disclosure and suspicious views, and works out the payout.",
    approval: "You approve",
    sketch: <PostSketch />,
    span: "lg:col-span-3",
  },
];

const approvals: { icon: LucideIcon; color: TileColor; title: string; text: string }[] = [
  {
    icon: Send,
    color: "orange",
    title: "Outreach",
    text: "Every message, before it is sent.",
  },
  {
    icon: Eye,
    color: "red",
    title: "Posts held in review",
    text: "A post that follows the brief but has odd views waits for your call.",
  },
  {
    icon: Wallet,
    color: "violet",
    title: "Payouts",
    text: "Every payout, before money moves. You pay creators directly.",
  },
];

const trust: { icon: LucideIcon; color: TileColor; title: string; text: string }[] = [
  {
    icon: Code,
    color: "green",
    title: "Numbers are computed in code",
    text: "Creator scores, fraud flags, verdicts and payout amounts are plain arithmetic on fetched data. The model reads a video against the brief. It never writes a flag or an amount, so every row can be audited.",
  },
  {
    icon: UserCheck,
    color: "orange",
    title: "A person approves",
    text: "Agents draft and calculate. A person approves outreach and payouts. Automated DMs break TikTok and Instagram terms, and payouts move real money.",
  },
  {
    icon: ShieldAlert,
    color: "pink",
    title: "Fraud flags you can read",
    text: "Each flag is a named check on a creator's own numbers: a post far above their usual views with far less engagement, very low engagement for the view count, a large following that barely watches, or posts stuck under 1,000 views.",
  },
];

const notYet = [
  "No paying customers and no pilots. The brand in the product is a sample until you set up your own.",
  "No creator has been contacted.",
  "The price is a proposal. No one has paid it.",
  "Fraud detection accuracy is not measured. The thresholds are first guesses.",
];

const included = [
  "A creator brief for your product",
  "A scored creator roster with fraud flags",
  "Outreach drafts for you to approve",
  "Every posted video checked against the brief",
  "A payout report for you to approve",
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className={cx(container, "flex h-16 items-center gap-6")}>
          <Link href="/welcome" className="flex items-center gap-2.5 rounded-full">
            <LogoMark className="size-6 text-ink" />
            <span className="text-[15px] font-semibold tracking-tight">Creator Ops</span>
          </Link>
          <nav aria-label="Sections" className="ml-auto hidden md:block">
            <ul className="flex gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={buttonClass({ variant: "quiet", size: "sm" })}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/" className={cx(buttonClass({ variant: "primary" }), "ml-auto md:ml-0")}>
            Try the Product
          </Link>
        </div>
      </header>

      <section className={cx(container, "pt-12 pb-16 md:pt-20 md:pb-24")}>
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <p className="inline-flex min-h-7 items-center gap-2 rounded-full bg-fill px-3 py-1 text-[13px] font-medium text-muted">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warn" />
              Hackathon build, October 2026. No customers yet.
            </p>
            <h1 className="mt-5 text-[42px] leading-[1.02] font-medium tracking-[-0.04em] text-balance md:text-[64px]">
              AI agents that run your creator program.
            </h1>
            <p className={cx(leadClass, "mt-5 max-w-[52ch]")}>
              Creator Ops is a company run by AI agents. It runs pay-per-view creator programs for
              consumer brands: the brief, the creators, the outreach, the video checks and the
              payout sheet. A person approves outreach and payouts.
            </p>
            <Cta className="mt-8" />
          </div>

          <div className="brand-field relative overflow-hidden rounded-[28px] p-4 sm:p-8 lg:py-14">
            <BlueField className="absolute inset-0 size-full" />
            <div className="welcome-rise relative">
              <NeedsYouPreview />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="problem" className="border-t border-line bg-soft">
        <div className={cx(container, "grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-14")}>
          <div>
            <h2 id="problem" className={h2Class}>
              Today this job is one person, a Discord server and a spreadsheet.
            </h2>
            <p className={cx(leadClass, "mt-5 max-w-[54ch]")}>
              Consumer brands pay small creators per 1,000 views to post TikToks. The marketplaces
              give a brand creators and a way to pay them. Someone still has to run the program.
            </p>
            <p className={cx(leadClass, "mt-4 max-w-[54ch]")}>
              Creator Ops is for a consumer app or brand that runs a creator program, or wants to,
              and does not want to hire for it. You hire us like you would hire a program manager.
            </p>
          </div>

          <div>
            <div className="rounded-[24px] bg-surface p-6 shadow-[0_0_0_1px_var(--color-line)]">
              <h3 className="text-base font-semibold tracking-tight">The weekly list</h3>
              <ul className="mt-3 flex flex-col">
                {chores.map((chore) => (
                  <li
                    key={chore.text}
                    className="flex items-center gap-3 border-t border-line py-3 text-[15px]"
                  >
                    <Tile color="grey" size="sm">
                      <chore.icon strokeWidth={2.25} />
                    </Tile>
                    {chore.text}
                  </li>
                ))}
              </ul>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-6">
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-muted text-pretty">
                  paid per 1,000 views in most campaigns
                </dt>
                <dd className="text-2xl font-medium tracking-[-0.03em] tabular-nums md:text-[28px]">
                  $0.50-1.50
                </dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-muted text-pretty">
                  clipped views in a month, as reported by Whop Content Rewards
                </dt>
                <dd className="text-2xl font-medium tracking-[-0.03em] tabular-nums md:text-[28px]">
                  3.5B+
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-faint text-pretty">
              Market figures from our own desk research on October 6, 2026. Sources: opus.pro on
              Whop Content Rewards, and clipaffiliates.com.
            </p>
          </div>
        </div>
      </section>

      <section id="how" aria-labelledby="how-title" className="scroll-mt-16">
        <div className={cx(container, "py-16 md:py-24")}>
          <div className="max-w-2xl">
            <h2 id="how-title" className={h2Class}>
              Four AI employees, one program.
            </h2>
            <p className={cx(leadClass, "mt-5")}>
              You hand over your product, budget and rules. Each employee does one part of the job
              and passes it on.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {employees.map((employee, index) => (
              <li
                key={employee.name}
                className={cx("card flex flex-col gap-5 p-4 sm:p-5", employee.span)}
              >
                {employee.sketch}
                <div className="mt-auto">
                  <div className="flex items-center gap-3">
                    <AgentTile agent={employee.name} />
                    <h3 className="text-lg font-semibold tracking-tight">
                      <span className="mr-2 font-normal text-faint tabular-nums">{index + 1}</span>
                      {employee.name}
                    </h3>
                    {employee.approval ? (
                      <span className="ml-auto">
                        <Badge tone="brand">{employee.approval}</Badge>
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted text-pretty">
                    {employee.job}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-faint">
            The pictures on this page are drawings of the product with sample data, not customer
            results.
          </p>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-14">
            <h3 className="text-2xl leading-tight font-medium tracking-[-0.02em] text-balance md:text-[28px]">
              What a person still approves
            </h3>
            <ul className="grid gap-6 sm:grid-cols-3">
              {approvals.map((item) => (
                <li key={item.title}>
                  <Tile color={item.color}>
                    <item.icon strokeWidth={2.25} />
                  </Tile>
                  <h4 className="mt-4 font-semibold tracking-tight">{item.title}</h4>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted text-pretty">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="trust" aria-labelledby="trust-title" className="scroll-mt-16 border-y border-line bg-soft">
        <div className={cx(container, "py-16 md:py-24")}>
          <div className="max-w-2xl">
            <h2 id="trust-title" className={h2Class}>
              Built so you can check the work.
            </h2>
            <p className={cx(leadClass, "mt-5")}>
              Catching fake views is the hard part of this market. Here is how we handle it, and
              what we have not proven yet.
            </p>
          </div>

          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {trust.map((item) => (
              <li key={item.title}>
                <Tile color={item.color}>
                  <item.icon strokeWidth={2.25} />
                </Tile>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted text-pretty">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-[24px] bg-surface p-6 shadow-[0_0_0_1px_var(--color-line)] md:p-8">
            <div className="flex items-center gap-3">
              <Tile color="grey">
                <ListChecks strokeWidth={2.25} />
              </Tile>
              <h3 className="text-lg font-semibold tracking-tight">Where this stands today</h3>
            </div>
            <ul className="mt-4 grid gap-x-10 md:grid-cols-2">
              {notYet.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 border-t border-line py-3.5 text-[15px] text-pretty"
                >
                  <Minus aria-hidden="true" className="mt-1 size-4 shrink-0 text-faint" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-16">
        <div className={cx(container, "py-16 md:py-24")}>
          <div className="max-w-2xl">
            <h2 id="pricing-title" className={h2Class}>
              One flat fee. No cut of payouts.
            </h2>
            <p className={cx(leadClass, "mt-5")}>
              We are the ones who flag fake views. If we took a share of payouts, we would earn
              more by missing fraud. A flat fee keeps us on your side.
            </p>
          </div>

          <div className="card mt-10 grid gap-8 p-6 md:p-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <Badge tone="warn">Proposed price</Badge>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-[56px] leading-none font-medium tracking-[-0.04em] tabular-nums md:text-[72px]">
                  $2,000
                </span>
                <span className="text-muted">a month</span>
              </p>
              <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-muted text-pretty">
                Per program, for up to 50 active creators. For up to 200 creators the proposed
                price is $4,000 a month. Neither price has been tested with a customer.
              </p>
              <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-muted text-pretty">
                You pay creators directly. We never hold creator money.
              </p>
              <Cta className="mt-8" big={false} />
            </div>
            <div>
              <h3 className="text-xs font-medium text-faint">What the fee covers</h3>
              <ul className="mt-2 flex flex-col">
                {included.map((line) => (
                  <li
                    key={line}
                    className="flex items-center gap-3 border-t border-line py-3.5 text-[15px]"
                  >
                    <Tile color="green" size="sm">
                      <Check strokeWidth={2.5} />
                    </Tile>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="closing" className={cx(container, "pb-16 md:pb-24")}>
        <div className="rounded-[28px] bg-fill px-6 py-14 text-center md:py-20">
          <span className="inline-block">
            <Tile color="blue">
              <MessagesSquare strokeWidth={2.25} />
            </Tile>
          </span>
          <h2
            id="closing"
            className="mx-auto mt-5 max-w-[18ch] text-[34px] leading-[1.05] font-medium tracking-[-0.035em] text-balance md:text-[52px]"
          >
            See it work, then ask it anything.
          </h2>
          <p className={cx(leadClass, "mx-auto mt-4 max-w-[46ch]")}>
            Open the product and look around a sample program. Or put your questions about the
            company to the AI team.
          </p>
          <Cta className="mt-8 justify-center" />
        </div>
      </section>

      <footer className="mt-auto border-t border-line">
        <div
          className={cx(
            container,
            "flex flex-col gap-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between",
          )}
        >
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-5 text-ink" />
            <span className="font-semibold text-ink">Creator Ops</span>
          </div>
          <p className="text-pretty">
            Built for the Crewbase Collective Zero Human Startup hackathon, October 2026.
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/" className="rounded-sm hover:text-ink">
                Product
              </Link>
            </li>
            <li>
              <Link href="/ask" className="rounded-sm hover:text-ink">
                Ask the AI Team
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
