"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { Eye, Heart, Target } from "lucide-react";
import { Avatar, Cover } from "@/components/media";
import { TrustBadge, TrustReasons } from "@/components/trust";
import { Badge, Chip, Handle, SectionLabel } from "@/components/ui";
import type { Post } from "@/lib/data";
import { cx, formatCompact, formatMoney, formatNumber } from "@/lib/format";
import { handleKey, trustFor, type Trust } from "@/lib/review/trust";

const views = [
  { value: "posts", label: "Top Posts" },
  { value: "creators", label: "Top Creators" },
] as const;
type View = (typeof views)[number]["value"];

const statusTone = {
  Approved: "good",
  "In review": "brand",
  Rejected: "bad",
} as const satisfies Record<Post["status"], string>;

const rate = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

// Gold, silver and bronze for the first three places.
const medal = [
  "[--tile-a:#ffdf70] [--tile-b:#eba400]",
  "[--tile-a:#c9ccd3] [--tile-b:#8d919b]",
  "[--tile-a:#f4b98a] [--tile-b:#c9773a]",
];

function Medal({ rank }: { rank: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cx("tile size-7 rounded-[9px] text-[13px] font-semibold", medal[rank - 1])}
      >
        {rank}
      </span>
      <span className="sr-only">Rank {rank}</span>
    </>
  );
}

function earns(post: Post) {
  if (post.status === "Rejected") return "Nothing";
  if (post.status === "In review") return "None yet";
  return formatMoney(post.payout ?? 0);
}

type CreatorRow = {
  handle: string;
  name?: string;
  avatar?: string;
  posts: number;
  views: number;
  earned: number;
  briefScore: number;
  trust: Trust;
  banned: boolean;
};

// One row per creator, from their program posts. Every number is a count, a
// sum or an average of what the posts already carry.
function creatorsFrom(posts: Post[], banned: Set<string>): CreatorRow[] {
  const groups = new Map<string, Post[]>();
  for (const post of posts) {
    const key = handleKey(post.handle);
    groups.set(key, [...(groups.get(key) ?? []), post]);
  }
  return [...groups.entries()].map(([key, theirs]) => ({
    handle: theirs[0].handle,
    name: theirs.find((post) => post.name)?.name,
    avatar: theirs.find((post) => post.avatar)?.avatar,
    posts: theirs.length,
    views: theirs.reduce((sum, post) => sum + post.views, 0),
    earned:
      Math.round(
        theirs
          .filter((post) => post.status === "Approved")
          .reduce((sum, post) => sum + (post.payout ?? 0), 0) * 100,
      ) / 100,
    briefScore: Math.round(theirs.reduce((sum, post) => sum + post.briefScore, 0) / theirs.length),
    trust: trustFor(theirs, banned.has(key)),
    banned: banned.has(key),
  }));
}

// One grid for the header and every row of a list, so the columns line up.
// On a phone a row keeps its rank, its name and its views, and the rest
// drops to a second line.
const postColumns =
  "grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 md:grid-cols-[1.5rem_minmax(0,1fr)_4.5rem_5.5rem_3rem_5.5rem_5rem] md:gap-x-4 md:px-5";
const creatorColumns =
  "grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 md:grid-cols-[1.5rem_minmax(0,1fr)_3rem_4.5rem_5rem_3rem_8rem] md:gap-x-4 md:px-5";

function TopPosts({ posts, left }: { posts: Post[]; left: number }) {
  const ranked = [...posts]
    .sort((a, b) => b.views - a.views)
    .map((post, index) => ({ post, rank: index + 1 }));
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <>
      {ranked.length === 0 ? (
        <p className="card p-10 text-center text-sm text-muted">
          Every program post so far is by a banned creator.
        </p>
      ) : null}

      {podium.length > 0 ? (
        <section aria-labelledby="top-posts" className="flex flex-col gap-3">
          <SectionLabel id="top-posts">Top three by views</SectionLabel>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {podium.map(({ post, rank }) => (
              <li key={post.id} className="card flex min-w-0 gap-4 p-3 text-sm md:flex-col md:gap-0">
                <span className="relative block w-24 shrink-0 md:w-full">
                  <Cover
                    src={post.cover}
                    alt=""
                    className="aspect-[3/4] w-full rounded-[14px] md:aspect-[4/3]"
                  />
                  <span className="absolute top-2 left-2 flex">
                    <Medal rank={rank} />
                  </span>
                </span>
                <div className="flex min-w-0 flex-1 flex-col md:px-2 md:pt-4 md:pb-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                    <Avatar handle={post.handle} src={post.avatar} size="sm" />
                    <span translate="no" className="truncate font-medium text-ink">
                      @{post.handle}
                    </span>
                  </span>
                  <p className="mt-1.5 truncate text-[13px] text-muted">
                    {post.caption || "No caption"}
                  </p>
                  <p className="mt-3 text-[30px] leading-none font-medium tracking-[-0.03em] tabular-nums md:text-[34px]">
                    {formatCompact(post.views)}
                  </p>
                  <p className="mt-1 text-xs text-faint">Views</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {post.engagementRate !== undefined ? (
                      <Chip color="green" label="Engagement" icon={Heart}>
                        {rate.format(post.engagementRate)}
                      </Chip>
                    ) : null}
                    <Chip color="orange" label="Brief score" icon={Target}>
                      {post.briefScore}
                    </Chip>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 md:mt-4">
                    <Badge tone={statusTone[post.status]}>{post.status}</Badge>
                    <span className="text-xs text-muted tabular-nums">
                      Earns <span className="font-medium text-ink">{earns(post)}</span>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section aria-labelledby="more-posts" className="flex flex-col gap-3">
          <SectionLabel id="more-posts">The rest</SectionLabel>
          <div className="card overflow-hidden">
            <div
              aria-hidden="true"
              className={cx(postColumns, "h-10 text-xs font-medium text-faint max-md:hidden")}
            >
              <span>#</span>
              <span>Post</span>
              <span className="text-right">Views</span>
              <span className="text-right">Engagement</span>
              <span className="text-right">Brief</span>
              <span>Status</span>
              <span className="text-right">Earns</span>
            </div>
            <ol>
              {rest.map(({ post, rank }) => (
                <li
                  key={post.id}
                  className={cx(postColumns, "border-line py-3 text-sm not-first:border-t md:border-t")}
                >
                  <span className="font-medium text-faint tabular-nums">
                    <span className="sr-only">Rank </span>
                    {rank}
                  </span>
                  <span className="flex min-w-0 items-center gap-3">
                    <Cover src={post.cover} alt="" className="h-12 w-9 shrink-0 rounded-[8px]" />
                    <span className="block min-w-0">
                      <span translate="no" className="block truncate font-medium">
                        @{post.handle}
                      </span>
                      <span className="block truncate text-xs text-faint">
                        {post.caption || "No caption"}
                      </span>
                    </span>
                  </span>
                  <span className="text-right font-medium tabular-nums">
                    <span className="sr-only">Views </span>
                    {formatCompact(post.views)}
                  </span>
                  <span className="text-right tabular-nums max-md:hidden">
                    <span className="sr-only">Engagement </span>
                    {post.engagementRate !== undefined ? rate.format(post.engagementRate) : "None"}
                  </span>
                  <span className="text-right tabular-nums max-md:hidden">
                    <span className="sr-only">Brief score </span>
                    {post.briefScore}
                  </span>
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5 max-md:col-span-2 max-md:col-start-2">
                    <Badge tone={statusTone[post.status]}>{post.status}</Badge>
                    <span className="flex flex-wrap gap-1 md:hidden">
                      {post.engagementRate !== undefined ? (
                        <Chip color="green" label="Engagement" icon={Heart}>
                          {rate.format(post.engagementRate)}
                        </Chip>
                      ) : null}
                      <Chip color="orange" label="Brief score" icon={Target}>
                        {post.briefScore}
                      </Chip>
                      <span className="self-center text-xs text-muted tabular-nums">
                        Earns {earns(post)}
                      </span>
                    </span>
                  </span>
                  <span className="text-right tabular-nums max-md:hidden">
                    <span className="sr-only">Earns </span>
                    {earns(post)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {left > 0 ? (
        <p className="text-[13px] text-pretty text-faint">
          {left === 1 ? "1 post by a banned creator is" : `${left} posts by banned creators are`}{" "}
          left out. Banned creators are listed under Top Creators.
        </p>
      ) : null}
    </>
  );
}

// The first thing that cost a creator points, with a count of the others.
const firstReason = (trust: Trust) =>
  trust.reasons.length === 0
    ? null
    : `${trust.reasons[0].text}${trust.reasons.length > 1 ? `, and ${trust.reasons.length - 1} more` : ""}`;

function TopCreators({ creators }: { creators: CreatorRow[] }) {
  const ranked = creators
    .filter((creator) => !creator.banned)
    .sort((a, b) => b.views - a.views)
    .map((creator, index) => ({ creator, rank: index + 1 }));
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const banned = creators.filter((creator) => creator.banned).sort((a, b) => b.views - a.views);

  return (
    <>
      {podium.length > 0 ? (
        <section aria-labelledby="top-creators" className="flex flex-col gap-3">
          <SectionLabel id="top-creators">Top three by views</SectionLabel>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {podium.map(({ creator, rank }) => (
              <li key={creator.handle} className="card flex min-w-0 flex-col p-5 text-sm">
                <span className="flex items-start justify-between gap-3">
                  <Avatar handle={creator.handle} src={creator.avatar} size="lg" />
                  <Medal rank={rank} />
                </span>
                <span translate="no" className="mt-4 block truncate font-semibold tracking-tight">
                  @{creator.handle}
                </span>
                <span className="block truncate text-[13px] text-muted">
                  {creator.name ?? "TikTok"} · {creator.posts === 1 ? "1 post" : `${creator.posts} posts`}
                </span>
                <span className="mt-4 flex items-end justify-between gap-3">
                  <span className="block">
                    <span className="block text-[34px] leading-none font-medium tracking-[-0.03em] tabular-nums">
                      {formatCompact(creator.views)}
                    </span>
                    <span className="mt-1 block text-xs text-faint">Total views</span>
                  </span>
                  <span className="block text-right text-xs text-muted tabular-nums">
                    <span className="block">{formatMoney(creator.earned)} earned</span>
                    <span className="block">Brief score {creator.briefScore}</span>
                  </span>
                </span>
                <div className="mt-4 border-t border-line pt-4">
                  <TrustBadge trust={creator.trust} />
                  <TrustReasons trust={creator.trust} className="mt-2.5" />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section aria-labelledby="more-creators" className="flex flex-col gap-3">
          <SectionLabel id="more-creators">The rest</SectionLabel>
          <div className="card overflow-hidden">
            <div
              aria-hidden="true"
              className={cx(creatorColumns, "h-10 text-xs font-medium text-faint max-md:hidden")}
            >
              <span>#</span>
              <span>Creator</span>
              <span className="text-right">Posts</span>
              <span className="text-right">Views</span>
              <span className="text-right">Earned</span>
              <span className="text-right">Brief</span>
              <span className="text-right">Trust</span>
            </div>
            <ol>
              {rest.map(({ creator, rank }) => {
                const reason = firstReason(creator.trust);
                return (
                  <li
                    key={creator.handle}
                    className={cx(
                      creatorColumns,
                      "border-line py-3 text-sm not-first:border-t md:border-t",
                    )}
                  >
                    <span className="font-medium text-faint tabular-nums">
                      <span className="sr-only">Rank </span>
                      {rank}
                    </span>
                    <Handle handle={creator.handle} name={creator.name} avatar={creator.avatar} />
                    <span className="text-right tabular-nums max-md:hidden">
                      <span className="sr-only">Posts </span>
                      {creator.posts}
                    </span>
                    <span className="text-right font-medium tabular-nums">
                      <span className="sr-only">Total views </span>
                      {formatCompact(creator.views)}
                    </span>
                    <span className="text-right tabular-nums max-md:hidden">
                      <span className="sr-only">Earned </span>
                      {formatMoney(creator.earned)}
                    </span>
                    <span className="text-right tabular-nums max-md:hidden">
                      <span className="sr-only">Average brief score </span>
                      {creator.briefScore}
                    </span>
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 max-md:col-span-2 max-md:col-start-2 md:justify-end">
                      <TrustBadge trust={creator.trust} />
                      <span className="text-xs text-muted tabular-nums md:hidden">
                        {creator.posts === 1 ? "1 post" : `${creator.posts} posts`} ·{" "}
                        {formatMoney(creator.earned)} earned · brief {creator.briefScore}
                      </span>
                    </span>
                    {reason ? (
                      <span className="col-start-2 -col-end-1 -mt-1 text-xs text-pretty text-faint">
                        {reason}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ) : null}

      {banned.length > 0 ? (
        <section aria-labelledby="banned-creators" className="flex flex-col gap-3">
          <div>
            <SectionLabel id="banned-creators">Banned</SectionLabel>
            <p className="mt-1 text-[13px] text-pretty text-faint">
              Not ranked. Their posts are rejected and earn nothing. Open one of their posts to
              lift a ban.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {banned.map((creator) => (
              <li key={creator.handle} className="card flex items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 opacity-75">
                  <Handle
                    handle={creator.handle}
                    name={`${creator.posts === 1 ? "1 post" : `${creator.posts} posts`} · ${formatNumber(creator.views)} views`}
                    avatar={creator.avatar}
                  />
                </span>
                <Badge tone="bad">Banned</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

export function Leaderboard({ posts, banned }: { posts: Post[]; banned: string[] }) {
  // The chosen view lives in the URL so it can be linked and survives a
  // refresh.
  const params = useSearchParams();
  const [view, setView] = useState<View>(
    params.get("view") === "creators" ? "creators" : "posts",
  );

  const out = new Set(banned);
  const counted = posts.filter((post) => !out.has(handleKey(post.handle)));
  const creators = creatorsFrom(posts, out);

  return (
    <Tabs.Root
      value={view}
      onValueChange={(value) => {
        setView(value as View);
        window.history.replaceState(
          null,
          "",
          value === "creators" ? "?view=creators" : window.location.pathname,
        );
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs.List className="relative flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-fill p-1 [scrollbar-width:none]">
          {/* The white pill slides to the chosen tab. Only this one span moves. */}
          <Tabs.Indicator
            renderBeforeHydration
            className="absolute top-1 left-0 h-8 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-full bg-surface shadow-[0_1px_2px_rgb(16_17_20/0.12),0_0_0_1px_rgb(16_17_20/0.04)] transition-[translate,width] duration-200 ease-out motion-reduce:transition-none"
          />
          {views.map(({ value, label }) => (
            <Tabs.Tab
              key={value}
              value={value}
              className="relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted select-none hover:text-ink focus-visible:outline-offset-0 data-[active]:text-ink"
            >
              {label}
              <span className="text-faint tabular-nums">
                {value === "posts" ? counted.length : creators.length}
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <p className="flex items-center gap-1.5 text-xs text-faint">
          <Eye aria-hidden="true" className="size-3.5" />
          Ranked by views. Program posts only.
        </p>
      </div>

      <Tabs.Panel value="posts" className="flex flex-col gap-6 rounded-[20px]">
        <TopPosts posts={counted} left={posts.length - counted.length} />
      </Tabs.Panel>
      <Tabs.Panel value="creators" className="flex flex-col gap-6 rounded-[20px]">
        <TopCreators creators={creators} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
