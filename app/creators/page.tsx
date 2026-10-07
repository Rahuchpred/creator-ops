import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Form from "next/form";
import Link from "next/link";
import { Check, FileText, Link2, Quote, Search, Wallet, X } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Avatar } from "@/components/media";
import { Badge, Button, Tile, type TileColor } from "@/components/ui";
import { cleanHandle, videosFor } from "@/lib/creators";
import type { Brand, Brief } from "@/lib/data";
import { formatAmount, formatMoney, formatNumber } from "@/lib/format";
import { getBrief, getPayoutApprovals, getPosts, getProgram } from "@/lib/store";
import { HandIn } from "./hand-in";
import { VideoCard } from "./video-card";

export const metadata: Metadata = {
  title: "Creator page",
  description: "Hand in your video, see what it earns and read the brief.",
};

type Query = Promise<{ handle?: string | string[] }>;

function Section({
  id,
  color,
  icon,
  title,
  children,
}: {
  id: string;
  color: TileColor;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} id={id} className="flex scroll-mt-6 flex-col gap-4">
      <h2
        id={`${id}-title`}
        className="flex items-center gap-3 text-[22px] font-medium tracking-[-0.02em] md:text-2xl"
      >
        <Tile color={color} size="sm">
          {icon}
        </Tile>
        {title}
      </h2>
      {children}
    </section>
  );
}

// The pay terms in one plain line.
function terms(brand: Brand) {
  return [
    `${formatAmount(brand.ratePerThousandViews)} per 1,000 views, up to ${formatAmount(brand.payoutCapPerPost)} per post.`,
    `A post starts earning at ${formatNumber(brand.minimumViews)} views.`,
    brand.hashtag ? `Tag it #${brand.hashtag}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// One creator's own videos. The handle comes from the address, so the page
// can be bookmarked. Nothing here reads the roster or the outreach.
async function Videos({ typed, brand }: { typed: string | undefined; brand: Brand }) {
  if (!typed?.trim()) return null;

  const handle = cleanHandle(typed);
  if (!handle) {
    return (
      <p role="status" className="card p-5 text-sm text-pretty text-muted">
        That does not look like a TikTok handle. Type it the way it shows on your profile, for
        example @yourname.
      </p>
    );
  }

  const [{ posts }, approvals] = await Promise.all([getPosts(), getPayoutApprovals()]);
  const videos = videosFor(handle, posts, brand, approvals);

  if (videos.length === 0) {
    return (
      <p role="status" className="card p-5 text-sm text-pretty text-muted">
        No videos handed in by <span translate="no">@{handle}</span> yet. Check the spelling, or
        hand in your first video above.
      </p>
    );
  }

  const earned = videos.reduce((sum, video) => sum + video.earned, 0);
  const approved = videos
    .filter((video) => video.payoutApproved)
    .reduce((sum, video) => sum + video.earned, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-4 p-5">
        <div className="flex min-w-0 flex-[1_1_100%] items-center gap-3 sm:flex-[1_1_12rem]">
          <Avatar handle={handle} />
          <div className="min-w-0">
            <div translate="no" className="truncate font-medium">
              @{handle}
            </div>
            <div className="text-xs text-faint">
              {videos.length} {videos.length === 1 ? "video" : "videos"} handed in
            </div>
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-faint">Total earned so far</dt>
            <dd className="text-[28px] leading-tight font-medium tracking-[-0.03em] tabular-nums">
              {formatMoney(earned)}
            </dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-faint">Approved for payout</dt>
            <dd className="text-[28px] leading-tight font-medium tracking-[-0.03em] tabular-nums">
              {formatMoney(approved)}
            </dd>
          </div>
        </dl>
      </div>
      <ul className="flex flex-col gap-3">
        {videos.map((video) => (
          <li key={video.id}>
            <VideoCard video={video} brand={brand.name} minimumViews={brand.minimumViews} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function List({ title, items, mark }: { title: string; items: string[]; mark: ReactNode }) {
  return (
    <div className="p-5 md:p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 flex flex-col gap-2.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            {mark}
            <span className="min-w-0 text-pretty">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The brief as a creator reads it. The research behind it stays inside.
function BriefForCreators({ brief }: { brief: Brief | null }) {
  if (!brief) {
    return (
      <p className="card p-5 text-sm text-muted">
        The brief is not written yet. Check back soon.
      </p>
    );
  }

  return (
    <article className="card divide-y divide-line">
      <div className="p-5 md:p-6">
        <h3 className="text-xs font-medium text-faint">Goal</h3>
        <p className="mt-1.5 text-xl leading-snug font-medium tracking-[-0.02em] text-balance">
          {brief.goal}
        </p>
        <h3 className="mt-5 text-xs font-medium text-faint">Angle</h3>
        <p className="mt-1.5 leading-relaxed text-pretty text-muted">{brief.angle}</p>
      </div>

      <div className="p-5 md:p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Quote aria-hidden="true" className="size-4 text-faint" />
          Opening lines to try
        </h3>
        <ol className="mt-3 flex flex-col gap-3 text-sm">
          {brief.hooks.map((hook, index) => (
            <li key={hook} className="flex items-start gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fill text-xs font-medium text-muted tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 pt-0.5 text-pretty">{hook}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid divide-line max-sm:divide-y sm:grid-cols-2 sm:divide-x">
        <List
          title="Every post includes"
          items={brief.mustInclude}
          mark={<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-good" strokeWidth={2.5} />}
        />
        <List
          title="What to avoid"
          items={brief.avoid}
          mark={<X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-bad" strokeWidth={2.5} />}
        />
      </div>
    </article>
  );
}

async function CreatorView({ searchParams }: { searchParams: Query }) {
  const [{ handle: given }, { brand }, brief] = await Promise.all([
    searchParams,
    getProgram(),
    getBrief(),
  ]);
  const typed = Array.isArray(given) ? given[0] : given;

  return (
    <>
      <header>
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-[12px] bg-ink text-sm font-semibold text-white uppercase"
          >
            {brand.name.slice(0, 1)}
          </span>
          <span translate="no" className="text-[15px] font-semibold tracking-tight">
            {brand.name}
          </span>
          <Badge>Creator page</Badge>
        </div>
        <h1 className="mt-6 text-[36px] leading-[1.05] font-medium tracking-[-0.035em] text-balance md:text-[52px]">
          Post for <span translate="no">{brand.name}</span>, get paid per view.
        </h1>
        <p className="mt-4 flex max-w-[60ch] items-start gap-2.5 text-[15px] leading-relaxed text-pretty text-muted md:text-base">
          <Wallet aria-hidden="true" className="mt-1 size-4 shrink-0 text-faint" />
          <span>{terms(brand)}</span>
        </p>
      </header>

      <Section id="hand-in" color="pink" icon={<Link2 strokeWidth={2.25} />} title="Hand in your video">
        <HandIn brand={brand.name} minimumViews={brand.minimumViews} ready={Boolean(brief)} />
      </Section>

      <Section id="videos" color="violet" icon={<Search strokeWidth={2.25} />} title="Look up your videos">
        <Form action="/creators" scroll={false} className="card flex flex-col gap-3 p-5">
          <label htmlFor="handle" className="text-sm font-medium">
            Your TikTok handle
          </label>
          <div className="flex flex-wrap gap-3">
            <input
              id="handle"
              name="handle"
              type="text"
              required
              maxLength={41}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              defaultValue={typed ?? ""}
              placeholder="@yourname…"
              className="h-11 min-w-0 flex-[1_1_12rem] rounded-full bg-surface px-4 text-sm text-ink shadow-[0_0_0_1px_var(--color-fill-strong)] placeholder:text-faint hover:shadow-[0_0_0_1px_#d6d6db]"
            />
            <Button type="submit" className="h-11 px-5 max-sm:w-full">
              Show My Videos
            </Button>
          </div>
          <p className="text-[13px] text-pretty text-faint">
            You see the videos handed in for your handle only. Bookmark the page to come back to
            them.
          </p>
        </Form>
        <Videos typed={typed} brand={brand} />
      </Section>

      <Section id="brief" color="orange" icon={<FileText strokeWidth={2.25} />} title="The brief">
        <BriefForCreators brief={brief} />
      </Section>

      <footer className="flex flex-col gap-4 border-t border-line pt-6 text-[13px] text-faint">
        <p className="max-w-[64ch] text-pretty">
          Views are counted by {brand.name}&apos;s program. A person approves every payout, and
          payment comes from {brand.name} directly.
        </p>
        <Link
          href="/welcome"
          className="flex items-center gap-2 self-start rounded-full hover:text-ink"
        >
          <LogoMark className="size-4" />
          Run on Creator Ops
        </Link>
      </footer>
    </>
  );
}

export default function CreatorsPage({ searchParams }: { searchParams: Query }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 py-10 md:gap-14 md:py-16">
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted">
            Loading the creator page…
          </p>
        }
      >
        <CreatorView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
