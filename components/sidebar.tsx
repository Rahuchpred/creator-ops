"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, FileText, LayoutGrid, MessagesSquare, Users, Wallet } from "lucide-react";
import { brand, totals } from "@/lib/data";
import { cx } from "@/lib/format";

const links = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/brief", label: "Brief", icon: FileText },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/posts", label: "Posts", icon: Clapperboard, count: totals.flaggedPosts },
  { href: "/payouts", label: "Payouts", icon: Wallet, count: totals.awaitingApproval },
  { href: "/activity", label: "Activity", icon: MessagesSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col gap-4 border-line bg-surface/70 p-3 backdrop-blur max-md:border-b md:sticky md:top-0 md:h-dvh md:w-60 md:border-r md:p-4">
      <div className="flex items-center gap-3 px-1">
        <span
          aria-hidden="true"
          className="brand-fill grid size-9 place-items-center rounded-[10px] text-sm font-semibold"
        >
          {brand.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{brand.name}</div>
          <div className="truncate text-xs text-faint">Creator program</div>
        </div>
      </div>

      <nav aria-label="Program" className="flex gap-1 overflow-x-auto md:flex-col">
        {links.map(({ href, label, icon: Icon, count }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex h-9 shrink-0 items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-medium transition-colors",
                active ? "brand-tint" : "text-muted hover:bg-brand-50 hover:text-ink",
              )}
            >
              <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
              {label}
              {count ? (
                <span className="ml-auto rounded-full bg-brand-500/10 px-1.5 text-xs tabular-nums text-brand-700 max-md:ml-1">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto px-1 text-xs text-faint text-pretty max-md:hidden">
        Sample data. The agents arrive in the next stages and fill these screens themselves.
      </p>
    </aside>
  );
}
