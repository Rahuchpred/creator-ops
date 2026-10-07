"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { Search } from "lucide-react";
import { Badge, Handle, tableClass as t } from "@/components/ui";
import type { Creator, CreatorStatus } from "@/lib/data";
import { formatCompact } from "@/lib/format";

const filters = ["All", "Suggested", "Contacted", "Onboarded", "Declined", "Rejected"] as const;
type Filter = (typeof filters)[number];

const statusTone = {
  Suggested: "neutral",
  Contacted: "brand",
  Onboarded: "good",
  Declined: "bad",
  Rejected: "bad",
} as const satisfies Record<CreatorStatus, string>;

export function RosterTable({ creators }: { creators: Creator[] }) {
  // The tab and the search live in the URL so a filtered roster can be linked.
  const params = useSearchParams();
  const fromUrl = params.get("status") as Filter | null;
  const [filter, setFilter] = useState<Filter>(
    fromUrl && filters.includes(fromUrl) ? fromUrl : "All",
  );
  const [query, setQuery] = useState(params.get("q") ?? "");

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

  return (
    <Tabs.Root value={filter} onValueChange={(value) => {
        setFilter(value as Filter);
        sync(value as Filter, query);
      }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs.List className="-m-1 flex max-w-full gap-1.5 overflow-x-auto p-1 [scrollbar-width:none]">
          {filters.map((status) => (
            <Tabs.Tab
              key={status}
              value={status}
              className="press group flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-fill px-3.5 text-[13px] font-medium text-ink select-none hover:bg-fill-strong data-[active]:bg-ink data-[active]:text-white"
            >
              {status}
              <span className="tabular-nums text-faint group-data-[active]:text-white/70">
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

      {filters.map((status) => {
        const rows = creators.filter((creator) => matches(creator, status));
        return (
          <Tabs.Panel key={status} value={status} className="mt-5 rounded-[20px]">
            {rows.length === 0 ? (
              <p className="card p-10 text-center text-sm text-muted">
                No creators match. Clear the search or pick another tab.
              </p>
            ) : (
              <div className={t.wrap}>
                <table className={t.table}>
                  <thead>
                    <tr>
                      <th scope="col" className={t.th}>Creator</th>
                      <th scope="col" className={t.th}>What they post</th>
                      <th scope="col" className={t.thRight}>Followers</th>
                      <th scope="col" className={t.thRight}>Typical views</th>
                      <th scope="col" className={t.thRight}>Score</th>
                      <th scope="col" className={t.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((creator) => (
                      <tr key={creator.handle} className={t.row}>
                        <td className={t.td}>
                          {creator.url ? (
                            <a
                              href={creator.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-full hover:opacity-80"
                            >
                              <Handle handle={creator.handle} name={creator.name} />
                            </a>
                          ) : (
                            <Handle handle={creator.handle} name={creator.name} />
                          )}
                        </td>
                        <td className={`${t.td} max-w-[340px] min-w-[260px] py-3`}>
                          <div>{creator.niche}</div>
                          <div className="text-xs text-pretty text-faint">
                            {creator.reason ?? creator.platform}
                          </div>
                        </td>
                        <td className={t.tdRight}>{formatCompact(creator.followers)}</td>
                        <td className={t.tdRight}>{formatCompact(creator.averageViews)}</td>
                        <td className={t.tdRight}>
                          <span className="inline-flex items-center justify-end gap-2">
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-12 overflow-hidden rounded-full bg-fill-strong"
                            >
                              <span
                                className="block h-full rounded-full bg-ink"
                                style={{ width: `${creator.score ?? creator.fit}%` }}
                              />
                            </span>
                            {creator.score ?? creator.fit}
                          </span>
                        </td>
                        <td className={t.td}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge tone={statusTone[creator.status]}>{creator.status}</Badge>
                            {creator.flags?.map((flag) => (
                              <Badge key={flag} tone="warn">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Panel>
        );
      })}
    </Tabs.Root>
  );
}
