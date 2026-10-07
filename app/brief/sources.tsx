"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { BookOpen, ChevronDown } from "lucide-react";
import { Tile } from "@/components/ui";
import type { Brief } from "@/lib/data";

// The reading list can run to dozens of pages, so it stays folded until
// someone asks for it.
export function Sources({ sources }: { sources: Brief["sources"] }) {
  const sites = new Set(sources.map((source) => source.site)).size;

  return (
    <Collapsible.Root className="card overflow-hidden">
      <Collapsible.Trigger className="group flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left hover:bg-surface focus-visible:bg-surface focus-visible:outline-offset-[-2px] md:px-6">
        <Tile color="grey" size="sm">
          <BookOpen strokeWidth={2.25} />
        </Tile>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold tracking-tight">
            {sources.length} {sources.length === 1 ? "page" : "pages"} the agent read
          </span>
          <span className="block text-xs text-faint">
            Across {sites} {sites === 1 ? "site" : "sites"}
          </span>
        </span>
        <span className="text-xs font-medium text-muted group-data-[panel-open]:hidden">Show</span>
        <span className="hidden text-xs font-medium text-muted group-data-[panel-open]:inline">
          Hide
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-faint transition-[rotate] duration-150 ease-out group-data-[panel-open]:rotate-180 motion-reduce:transition-none"
        />
      </Collapsible.Trigger>
      <Collapsible.Panel className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[ending-style]:duration-150 data-[starting-style]:h-0 motion-reduce:transition-none">
        <ul className="grid gap-x-8 px-5 pb-3 text-sm md:grid-cols-2 md:px-6">
          {sources.map((source) => (
            <li key={source.url} className="flex min-w-0 gap-3 border-t border-line py-2.5">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate hover:underline"
              >
                {source.title}
              </a>
              <span className="ml-auto shrink-0 text-xs leading-5 text-faint">{source.site}</span>
            </li>
          ))}
        </ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
