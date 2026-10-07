"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { Search } from "lucide-react";
import { Badge, Handle, tableClass as t } from "@/components/ui";
import type { Creator, CreatorStatus } from "@/lib/data";
import { formatCompact } from "@/lib/format";

const filters = ["All", "Suggested", "Contacted", "Onboarded", "Declined"] as const;
type Filter = (typeof filters)[number];

const statusTone = {
  Suggested: "neutral",
  Contacted: "brand",
  Onboarded: "good",
  Declined: "bad",
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
        <Tabs.List className="relative flex gap-1 overflow-x-auto rounded-[12px] bg-ink/[0.04] p-1">
          {filters.map((status) => (
            <Tabs.Tab
              key={status}
              value={status}
              className="relative z-[1] flex h-7 shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium text-muted transition-colors select-none hover:text-ink data-[active]:text-brand-700"
            >
              {status}
              <span className="tabular-nums text-faint">
                {creators.filter((creator) => matches(creator, status)).length}
              </span>
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className="brand-tint absolute top-1 left-0 h-7 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-[8px] transition-[translate,width] duration-200 ease-out motion-reduce:transition-none" />
        </Tabs.List>

        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Search creators</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
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
            className="h-9 w-full rounded-[10px] bg-surface pr-3 pl-9 text-sm shadow-[0_0_0_1px_rgb(14_21_38/0.1),0_1px_2px_rgb(14_21_38/0.05)] placeholder:text-faint"
          />
        </label>
      </div>

      {filters.map((status) => {
        const rows = creators.filter((creator) => matches(creator, status));
        return (
          <Tabs.Panel key={status} value={status} className="mt-4 rounded-[14px]">
            {rows.length === 0 ? (
              <p className="card p-8 text-center text-sm text-muted">
                No creators match. Clear the search or pick another tab.
              </p>
            ) : (
              <div className={t.wrap}>
                <table className={t.table}>
                  <thead>
                    <tr>
                      <th scope="col" className={t.th}>Creator</th>
                      <th scope="col" className={t.th}>Niche</th>
                      <th scope="col" className={t.thRight}>Followers</th>
                      <th scope="col" className={t.thRight}>Typical views</th>
                      <th scope="col" className={t.thRight}>Fit</th>
                      <th scope="col" className={t.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((creator) => (
                      <tr key={creator.handle} className={t.row}>
                        <td className={t.td}>
                          <Handle handle={creator.handle} name={creator.name} />
                        </td>
                        <td className={t.td}>
                          <div>{creator.niche}</div>
                          <div className="text-xs text-faint">{creator.platform}</div>
                        </td>
                        <td className={t.tdRight}>{formatCompact(creator.followers)}</td>
                        <td className={t.tdRight}>{formatCompact(creator.averageViews)}</td>
                        <td className={t.tdRight}>
                          <span className="inline-flex items-center justify-end gap-2">
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-12 overflow-hidden rounded-full bg-brand-100"
                            >
                              <span
                                className="brand-fill block h-full rounded-full"
                                style={{ width: `${creator.fit}%` }}
                              />
                            </span>
                            {creator.fit}
                          </span>
                        </td>
                        <td className={t.td}>
                          <Badge tone={statusTone[creator.status]}>{creator.status}</Badge>
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
