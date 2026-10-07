"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { ArrowUpRight, Search } from "lucide-react";
import { DetailDialog, Fact } from "@/components/detail-dialog";
import { Avatar } from "@/components/media";
import {
  Badge,
  Handle,
  SectionLabel,
  buttonClass,
  cardButtonClass,
} from "@/components/ui";
import type { Creator, CreatorStatus } from "@/lib/data";
import { cx, formatCompact, formatMoney } from "@/lib/format";
import { handleKey } from "@/lib/review/trust";

const filters = ["All", "Suggested", "Contacted", "Onboarded", "Declined", "Rejected"] as const;
type Filter = (typeof filters)[number];

const statusTone = {
  Suggested: "neutral",
  Contacted: "brand",
  Onboarded: "good",
  Declined: "bad",
  Rejected: "bad",
} as const satisfies Record<CreatorStatus, string>;

// Creators who said no or were screened out are not candidates, so they sit
// under the ranking and carry no rank. So does anyone a person banned.
const left = (creator: Creator) => creator.status === "Rejected" || creator.status === "Declined";
const scoreOf = (creator: Creator) => creator.score ?? creator.fit;
const rate = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const percent = (value: number) => rate.format(value);

// Gold, silver and bronze for the first three places.
const medal = [
  "[--tile-a:#ffdf70] [--tile-b:#eba400]",
  "[--tile-a:#c9ccd3] [--tile-b:#8d919b]",
  "[--tile-a:#f4b98a] [--tile-b:#c9773a]",
];

// One grid for the header and every row, so the columns line up.
const columns =
  "grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 md:grid-cols-[1.75rem_minmax(0,1.4fr)_minmax(0,1fr)_4.5rem_6rem_5.5rem_8.5rem] md:gap-x-4 md:px-5";

function Score({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center justify-end gap-2 tabular-nums">
      <span aria-hidden="true" className="h-1.5 w-10 overflow-hidden rounded-full bg-fill-strong">
        <span className="block h-full rounded-full bg-ink" style={{ width: `${value}%` }} />
      </span>
      <span className="sr-only">Score </span>
      <span className="w-6 text-right font-medium">{value}</span>
    </span>
  );
}

// The status, then the flags. A row has room for one flag by name.
function Marks({ creator, all, banned }: { creator: Creator; all?: boolean; banned?: boolean }) {
  const flags = creator.flags ?? [];
  return (
    <>
      {banned ? <Badge tone="bad">Banned</Badge> : null}
      <Badge tone={statusTone[creator.status]}>{creator.status}</Badge>
      {all || flags.length === 1 ? (
        flags.map((flag) => (
          <Badge key={flag} tone="warn">
            {flag}
          </Badge>
        ))
      ) : flags.length > 1 ? (
        <Badge tone="warn">{flags.length} flags</Badge>
      ) : null}
    </>
  );
}

export function RosterRanking({
  creators,
  banned = [],
}: {
  creators: Creator[];
  // Handles a person banned from the program, lowercase.
  banned?: string[];
}) {
  const isBanned = (creator: Creator) => banned.includes(handleKey(creator.handle));
  const out = (creator: Creator) => left(creator) || isBanned(creator);
  // The tab and the search live in the URL so a filtered roster can be linked.
  const params = useSearchParams();
  const fromUrl = params.get("status") as Filter | null;
  const [filter, setFilter] = useState<Filter>(
    fromUrl && filters.includes(fromUrl) ? fromUrl : "All",
  );
  const [query, setQuery] = useState(params.get("q") ?? "");
  // The chosen creator stays set while the dialog animates out, so its text
  // does not blank mid-close.
  const [chosen, setChosen] = useState<Creator | null>(null);
  const [open, setOpen] = useState(false);

  const sync = (nextFilter: Filter, nextQuery: string) => {
    const next = new URLSearchParams();
    if (nextFilter !== "All") next.set("status", nextFilter);
    if (nextQuery.trim()) next.set("q", nextQuery.trim());
    const search = next.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  };

  const needle = query.trim().toLowerCase();
  const matches = (creator: Creator, status: Filter) =>
    (status === "All" || creator.status === status) &&
    (needle === "" ||
      creator.handle.toLowerCase().includes(needle) ||
      creator.name.toLowerCase().includes(needle) ||
      creator.niche.toLowerCase().includes(needle));

  // A creator's rank is their place among all candidates. It does not change
  // when the list is filtered or searched.
  const ranked = creators
    .filter((creator) => !out(creator))
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .map((creator, index) => ({ creator, rank: index + 1 }));
  const shown = ranked.filter(({ creator }) => matches(creator, filter));
  const podium = shown.filter(({ rank }) => rank <= 3);
  const rest = shown.filter(({ rank }) => rank > 3);
  const outside = creators
    .filter((creator) => out(creator) && matches(creator, filter))
    .sort((a, b) => scoreOf(b) - scoreOf(a));

  const show = (creator: Creator) => {
    setChosen(creator);
    setOpen(true);
  };

  return (
    <Tabs.Root
      value={filter}
      onValueChange={(value) => {
        setFilter(value as Filter);
        sync(value as Filter, query);
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
          {filters.map((status) => (
            <Tabs.Tab
              key={status}
              value={status}
              className="group relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted select-none hover:text-ink focus-visible:outline-offset-0 data-[active]:text-ink"
            >
              {status}
              <span className="tabular-nums text-faint">
                {creators.filter((creator) => matches(creator, status)).length}
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Search creators</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            name="creator-search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              sync(filter, event.target.value);
            }}
            placeholder="Search by handle or niche…"
            className="h-10 w-full rounded-full bg-fill pr-4 pl-10 text-sm placeholder:text-faint"
          />
        </label>
      </div>

      <Tabs.Panel value={filter} className="flex flex-col gap-6 rounded-[20px]">
        {shown.length === 0 && outside.length === 0 ? (
          <p className="card p-10 text-center text-sm text-muted">
            No creators match. Clear the search or pick another tab.
          </p>
        ) : null}

        {podium.length > 0 ? (
          <section aria-labelledby="top-three" className="flex flex-col gap-3">
            <SectionLabel id="top-three">Top three</SectionLabel>
            <ol className="grid gap-4 md:grid-cols-3">
              {podium.map(({ creator, rank }) => (
                <li key={creator.handle}>
                  <button
                    type="button"
                    onClick={() => show(creator)}
                    className={cx(cardButtonClass, "h-full p-5")}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <Avatar handle={creator.handle} src={creator.avatar} size="lg" />
                      <span
                        aria-hidden="true"
                        className={cx(
                          "tile size-7 rounded-[9px] text-[13px] font-semibold",
                          medal[rank - 1],
                        )}
                      >
                        {rank}
                      </span>
                      <span className="sr-only">Rank {rank}</span>
                    </span>
                    <span translate="no" className="mt-4 block truncate font-semibold tracking-tight">
                      @{creator.handle}
                    </span>
                    <span className="block truncate text-[13px] text-muted">
                      {creator.name} · {creator.niche}
                    </span>
                    <span className="mt-4 flex items-end justify-between gap-3">
                      <span className="block">
                        <span className="block text-[34px] leading-none font-medium tracking-[-0.03em] tabular-nums">
                          {scoreOf(creator)}
                        </span>
                        <span className="mt-1 block text-xs text-faint">Score</span>
                      </span>
                      <span className="block text-right text-xs text-muted tabular-nums">
                        <span className="block">{formatCompact(creator.followers)} followers</span>
                        <span className="block">
                          {formatCompact(creator.averageViews)} typical views
                        </span>
                      </span>
                    </span>
                    <span className="mt-4 flex flex-wrap items-center gap-1.5">
                      <Marks creator={creator} />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {rest.length > 0 ? (
          <section aria-labelledby="ranking" className="flex flex-col gap-3">
            <SectionLabel id="ranking">{podium.length > 0 ? "The rest" : "Ranking"}</SectionLabel>
            <div className="card overflow-hidden">
              <div aria-hidden="true" className={cx(columns, "h-10 text-xs font-medium text-faint max-md:hidden")}>
                <span>#</span>
                <span>Creator</span>
                <span>What they post</span>
                <span className="text-right">Followers</span>
                <span className="text-right">Typical views</span>
                <span className="text-right">Score</span>
                <span className="text-right">Status</span>
              </div>
              <ol>
                {rest.map(({ creator, rank }) => (
                  <li key={creator.handle} className="border-line not-first:border-t md:border-t">
                    <button
                      type="button"
                      onClick={() => show(creator)}
                      className={cx(
                        columns,
                        "w-full cursor-pointer py-3 text-left text-sm hover:bg-surface focus-visible:bg-surface focus-visible:outline-offset-[-2px]",
                      )}
                    >
                      <span className="font-medium tabular-nums text-faint">
                        <span className="sr-only">Rank </span>
                        {rank}
                      </span>
                      <Handle handle={creator.handle} name={creator.name} avatar={creator.avatar} />
                      <span className="truncate text-muted max-md:hidden">{creator.niche}</span>
                      <span className="text-right tabular-nums max-md:hidden">
                        <span className="sr-only">Followers </span>
                        {formatCompact(creator.followers)}
                      </span>
                      <span className="text-right tabular-nums max-md:hidden">
                        <span className="sr-only">Typical views </span>
                        {formatCompact(creator.averageViews)}
                      </span>
                      <Score value={scoreOf(creator)} />
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5 max-md:col-span-2 max-md:col-start-2 md:justify-end">
                        <Marks creator={creator} />
                        <span className="truncate text-xs text-faint md:hidden">{creator.niche}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        {outside.length > 0 ? (
          <section aria-labelledby="not-ranked" className="flex flex-col gap-3">
            <div>
              <SectionLabel id="not-ranked">Not in the ranking</SectionLabel>
              <p className="mt-1 text-[13px] text-pretty text-faint">
                Screened out, banned or said no. Open one to read why.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {outside.map((creator) => (
                <li key={creator.handle}>
                  <button
                    type="button"
                    onClick={() => show(creator)}
                    className={cx(cardButtonClass, "flex items-center gap-3 px-4 py-3 text-sm")}
                  >
                    <span className="min-w-0 flex-1 opacity-75">
                      <Handle
                        handle={creator.handle}
                        name={`${formatCompact(creator.followers)} followers · score ${scoreOf(creator)}`}
                        avatar={creator.avatar}
                      />
                    </span>
                    {isBanned(creator) ? (
                      <Badge tone="bad">Banned</Badge>
                    ) : (
                      <Badge tone={statusTone[creator.status]}>{creator.status}</Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Tabs.Panel>

      <DetailDialog
        open={open}
        onOpenChange={setOpen}
        title={chosen ? `@${chosen.handle}` : "Creator"}
      >
        {chosen ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 pr-10">
              <Avatar handle={chosen.handle} src={chosen.avatar} size="lg" />
              <div className="min-w-0">
                <div translate="no" className="truncate text-xl font-medium tracking-[-0.02em]">
                  @{chosen.handle}
                </div>
                <div className="truncate text-sm text-muted">
                  {chosen.name} · {chosen.platform}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Marks creator={chosen} all banned={isBanned(chosen)} />
            </div>
            {isBanned(chosen) ? (
              <p className="rounded-[14px] bg-bad-soft px-4 py-3 text-sm text-pretty text-bad">
                Banned from the program. Their posts are rejected and new ones are refused. Open
                one of their posts to lift the ban.
              </p>
            ) : null}
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Fact label="Score" value={scoreOf(chosen)} />
              <Fact label="Followers" value={formatCompact(chosen.followers)} />
              <Fact label="Typical views" value={formatCompact(chosen.averageViews)} />
              <Fact label="Content fit" value={chosen.fit} />
              {chosen.engagementRate !== undefined ? (
                <Fact label="Engagement" value={percent(chosen.engagementRate)} />
              ) : null}
              {chosen.estimatedPayout !== undefined ? (
                <Fact label="A typical post earns" value={formatMoney(chosen.estimatedPayout)} />
              ) : null}
            </dl>
            <div>
              <h3 className="text-xs font-medium text-faint">What they post</h3>
              <p className="mt-1 text-sm text-pretty">{chosen.niche}</p>
            </div>
            {chosen.reason ? (
              <div>
                <h3 className="text-xs font-medium text-faint">Why this score</h3>
                <p className="mt-1 text-sm leading-relaxed text-pretty">{chosen.reason}</p>
              </div>
            ) : null}
            {chosen.url ? (
              <a
                href={chosen.url}
                target="_blank"
                rel="noreferrer"
                className={cx(buttonClass(), "self-start")}
              >
                Open on {chosen.platform}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            ) : null}
          </div>
        ) : null}
      </DetailDialog>
    </Tabs.Root>
  );
}
