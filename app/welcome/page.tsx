import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlueField } from "@/components/blue-field";
import { GlowWordmark } from "@/components/glow-wordmark";
import { LogoMark } from "@/components/logo";
import { AgentTile, Badge, buttonClass } from "@/components/ui";
import { cx } from "@/lib/format";
import {
  ApprovalSketch,
  BriefWindow,
  FlagSketch,
  FormulaSketch,
  OutreachWindow,
  PostsWindow,
  ProductWindow,
  RosterWindow,
} from "./illustrations";

export const metadata: Metadata = {
  title: "AI agents that run your creator program",
  description:
    "Creator Ops is a company run by AI agents. It runs pay-per-view creator programs for consumer brands: the brief, the creators, the outreach, the video checks and the payouts. A person approves outreach and payouts.",
};

// The page follows the order of cursor.com: a left-set headline over one big
// product panel, a stack of split feature cards, a three-card grid, a row of
// short cards, one more split, then a single closing line.

const container = "mx-auto w-full max-w-[1240px] px-4 md:px-8";
const h2Class = "text-[26px] leading-[1.15] font-medium tracking-[-0.025em] text-balance md:text-[32px]";
const blockTitle = "text-[22px] leading-[1.2] font-medium tracking-[-0.02em] text-balance";
const blockBody = "text-[17px] leading-[1.45] text-muted text-pretty";
const bigButton = "h-12 px-6 text-[15px]";
const panel = "rounded-[28px] bg-soft shadow-[0_0_0_1px_var(--color-line)]";

const nav = [
  { label: "Agents", href: "#agents" },
  { label: "Trust", href: "#trust" },
  { label: "Pricing", href: "#pricing" },
];

function Cta({ className }: { className?: string }) {
  return (
    <div className={cx("flex flex-wrap gap-3", className)}>
      <Link href="/" className={cx(buttonClass({ variant: "primary" }), bigButton)}>
        Try the Product
        <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} />
      </Link>
      <Link href="/ask" className={cx(buttonClass(), bigButton)}>
        Ask the AI Team
      </Link>
    </div>
  );
}

// The one text link a block gets. Blue as text, never as a fill.
function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 rounded-sm text-[15px] font-medium text-brand-600 hover:text-brand-700"
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
        strokeWidth={2.25}
      />
    </Link>
  );
}

type Feature = {
  agent: string;
  title: string;
  body: string;
  link: { label: string; href: string };
  demo: ReactNode;
};

const features: Feature[] = [
  {
    agent: "Strategy",
    title: "A brief built from what works",
    body: "The Strategy agent reads what is performing in your niche and writes the creator brief. Every reference links to the page it read, so you can check it.",
    link: { label: "See the brief", href: "/brief" },
    demo: <BriefWindow />,
  },
  {
    agent: "Research",
    title: "Creators scored on their real numbers",
    body: "The Research agent finds creators on TikTok and scores each one from their own view and engagement counts. It rejects accounts whose views look fake and shows the reason.",
    link: { label: "See the roster", href: "/roster" },
    demo: <RosterWindow />,
  },
  {
    agent: "Sales",
    title: "Outreach that waits for your yes",
    body: "The Sales agent drafts one message per creator on the shortlist. Nothing is sent until you approve it, because automated DMs break TikTok and Instagram terms.",
    link: { label: "Read the drafts", href: "/outreach" },
    demo: <OutreachWindow />,
  },
  {
    agent: "Marketing",
    title: "Every video checked, every payout worked out",
    body: "The Marketing agent scores each posted video against the brief and flags missing disclosure or suspicious views. You get a payout sheet to approve, then you pay creators directly.",
    link: { label: "See the posts", href: "/posts" },
    demo: <PostsWindow />,
  },
];

const trust: { title: string; body: string; sketch: ReactNode }[] = [
  {
    title: "Numbers are computed in code",
    body: "Scores, fraud flags and payout amounts are arithmetic on fetched data. The model never writes a flag or an amount.",
    sketch: <FormulaSketch />,
  },
  {
    title: "A person approves",
    body: "Agents draft and calculate. You approve every outreach message and every payout before anything goes out.",
    sketch: <ApprovalSketch />,
  },
  {
    title: "Fraud flags you can read",
    body: "Each flag is a named check on a creator's own numbers. You see which check fired and why.",
    sketch: <FlagSketch />,
  },
];

const standing = [
  {
    label: "Customers",
    text: "No paying customers and no pilots. The brand in the product is a sample until you set up your own.",
  },
  { label: "Creators", text: "No creator has been contacted." },
  { label: "Price", text: "The price is a proposal. No one has paid it." },
  { label: "Fraud checks", text: "Accuracy is not measured. The thresholds are first guesses." },
];

const tiers = [
  { size: "Up to 50 active creators", price: "$2,000" },
  { size: "Up to 200 active creators", price: "$4,000" },
];

const footer = [
  {
    label: "Program",
    links: [
      { label: "Overview", href: "/" },
      { label: "Setup", href: "/program" },
      { label: "Brief", href: "/brief" },
    ],
  },
  {
    label: "Creators",
    links: [
      { label: "Roster", href: "/roster" },
      { label: "Outreach", href: "/outreach" },
    ],
  },
  {
    label: "Content",
    links: [
      { label: "Posts", href: "/posts" },
      { label: "Payouts", href: "/payouts" },
    ],
  },
  {
    label: "Team",
    links: [
      { label: "Activity", href: "/activity" },
      { label: "Ask the AI team", href: "/ask" },
    ],
  },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 bg-canvas/85 backdrop-blur-md">
        <div className={cx(container, "flex h-16 items-center gap-2")}>
          <Link href="/welcome" className="flex items-center gap-2.5 rounded-full md:flex-1">
            <LogoMark className="size-6 text-ink" />
            <span className="text-[15px] font-semibold tracking-tight">Creator Ops</span>
          </Link>
          <nav aria-label="Sections" className="hidden md:block">
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
          <div className="ml-auto flex items-center justify-end gap-2 md:ml-0 md:flex-1">
            <Link
              href="/ask"
              className={cx(buttonClass({ variant: "quiet", size: "sm" }), "max-sm:hidden")}
            >
              Ask the AI Team
            </Link>
            <Link href="/" className={buttonClass({ variant: "primary", size: "sm" })}>
              Try the Product
            </Link>
          </div>
        </div>
      </header>

      <section className={cx(container, "pt-12 md:pt-20")}>
        <h1 className="max-w-[21ch] text-[34px] leading-[1.08] font-medium tracking-[-0.035em] text-balance md:text-[48px]">
          Creator Ops is the AI team that runs your pay-per-view creator program.
        </h1>
        <Cta className="mt-8" />

        <div className="brand-field relative mt-12 overflow-hidden rounded-[28px] px-4 py-10 sm:p-12 md:mt-16 lg:px-24 lg:py-20">
          <BlueField className="absolute inset-0 size-full" />
          <div className="welcome-rise relative mx-auto max-w-[920px]">
            <ProductWindow />
          </div>
        </div>
      </section>

      <section id="agents" aria-label="The four agents" className="scroll-mt-20">
        <ol className={cx(container, "flex flex-col gap-5 pt-20 md:pt-28")}>
          {features.map((feature, index) => (
            <li key={feature.agent} className={cx(panel, "grid gap-2 p-2 lg:grid-cols-3")}>
              <div
                className={cx(
                  "flex flex-col justify-center gap-4 p-6 md:p-10",
                  index % 2 === 1 && "lg:order-last",
                )}
              >
                <AgentTile agent={feature.agent} />
                <div>
                  <h2 className={blockTitle}>{feature.title}</h2>
                  <p className={cx(blockBody, "mt-2")}>{feature.body}</p>
                </div>
                <TextLink href={feature.link.href}>{feature.link.label}</TextLink>
              </div>
              <div className="grid min-h-[340px] place-items-center rounded-[22px] bg-fill px-4 py-10 sm:px-10 lg:col-span-2 lg:min-h-[520px]">
                <div className="w-full max-w-[460px]">{feature.demo}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="trust" aria-labelledby="trust-title" className="scroll-mt-20">
        <div className={cx(container, "pt-20 md:pt-28")}>
          <h2 id="trust-title" className={h2Class}>
            Built so you can check the work
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {trust.map((item) => (
              <li key={item.title} className={cx(panel, "flex flex-col gap-8 p-6 md:p-8")}>
                <div>
                  <h3 className="text-[17px] font-medium tracking-[-0.01em]">{item.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted text-pretty">
                    {item.body}
                  </p>
                </div>
                <div className="mt-auto">{item.sketch}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="standing-title">
        <div className={cx(container, "pt-20 md:pt-28")}>
          <h2 id="standing-title" className={h2Class}>
            Where this stands today
          </h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {standing.map((item) => (
              <li key={item.label} className="rounded-[20px] bg-soft p-5 shadow-[0_0_0_1px_var(--color-line)]">
                <h3 className="text-sm text-faint">{item.label}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-pretty">{item.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <TextLink href="/ask">Ask the AI team anything</TextLink>
          </p>
        </div>
      </section>

      <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20">
        <div className={cx(container, "pt-20 md:pt-28")}>
          <div className={cx(panel, "grid gap-2 p-2 lg:grid-cols-3")}>
            <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
              <div>
                <h2 id="pricing-title" className={blockTitle}>
                  One flat fee. No cut of payouts.
                </h2>
                <p className={cx(blockBody, "mt-2")}>
                  We are the ones who flag fake views. A share of payouts would pay us more for
                  missing fraud, so the fee stays flat.
                </p>
              </div>
              <TextLink href="/ask">Ask about pricing</TextLink>
            </div>
            <div className="grid place-items-center rounded-[22px] bg-fill px-4 py-10 sm:px-10 lg:col-span-2 lg:min-h-[440px]">
              <div className="w-full max-w-[460px] rounded-[22px] bg-surface p-6 shadow-[0_0_0_1px_rgb(16_17_20/0.06),0_24px_48px_-28px_rgb(16_17_20/0.35)] md:p-8">
                <Badge tone="warn">Proposed price</Badge>
                <dl className="mt-3 flex flex-col">
                  {tiers.map((tier) => (
                    <div
                      key={tier.size}
                      className="flex flex-col-reverse gap-1 border-b border-line py-5"
                    >
                      <dt className="text-[15px] text-muted">{tier.size}</dt>
                      <dd className="flex items-baseline gap-2">
                        <span className="text-[44px] leading-none font-medium tracking-[-0.04em] tabular-nums md:text-[52px]">
                          {tier.price}
                        </span>
                        <span className="text-muted">a month</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 text-sm leading-relaxed text-muted text-pretty">
                  Per program. No customer has paid either price. You pay creators directly, and
                  we never hold creator money.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="closing" className={cx(container, "py-28 text-center md:py-40")}>
        <h2
          id="closing"
          className="text-[44px] leading-[1.02] font-medium tracking-[-0.04em] text-balance md:text-[72px]"
        >
          Try Creator Ops now.
        </h2>
        <Cta className="mt-8 justify-center" />
      </section>

      <footer className="mt-auto overflow-hidden border-t border-line">
        <div
          className={cx(
            container,
            "grid grid-cols-2 gap-x-6 gap-y-10 pt-14 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]",
          )}
        >
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-7 text-ink" />
              <span className="font-semibold tracking-tight">Creator Ops</span>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              Hackathon build, October 2026
              <br />
              Pictures are drawings with sample data
            </p>
          </div>
          {footer.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <h2 className="text-[13px] text-faint">{group.label}</h2>
              <ul className="mt-3 flex flex-col gap-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="rounded-sm hover:text-muted">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className={cx(container, "pt-12 md:pt-16")}>
          <GlowWordmark>Creator Ops</GlowWordmark>
        </div>
      </footer>
    </div>
  );
}
