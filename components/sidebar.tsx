"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  FileText,
  LayoutGrid,
  MessagesSquare,
  Send,
  Users,
  Wallet,
} from "lucide-react";
import { brand } from "@/lib/data";
import { cx } from "@/lib/format";

const links = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/brief", label: "Brief", icon: FileText },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/posts", label: "Posts", icon: Clapperboard },
  { href: "/payouts", label: "Payouts", icon: Wallet },
  { href: "/activity", label: "Activity", icon: MessagesSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col gap-3 border-line bg-surface p-3 max-md:border-b md:sticky md:top-0 md:h-dvh md:w-64 md:gap-6 md:border-r md:p-4">
      <div className="flex items-center gap-3 px-1.5 md:pt-1.5">
        <span
          aria-hidden="true"
          className="brand-fill grid size-8 place-items-center rounded-[10px] text-sm font-semibold"
        >
          {brand.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold tracking-tight">{brand.name}</div>
          <div className="truncate text-xs text-faint">Creator program</div>
        </div>
      </div>

      {/* The padding and negative margin leave room for the focus ring inside the scroller. */}
      <nav aria-label="Program" className="-m-1 flex gap-1 overflow-x-auto p-1 [scrollbar-width:none] md:flex-col">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "press flex h-10 shrink-0 items-center gap-3 rounded-full px-3.5 text-sm font-medium md:h-11",
                active ? "bg-fill text-ink" : "text-muted hover:bg-fill/70 hover:text-ink",
              )}
            >
              <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto rounded-[16px] p-3.5 text-xs leading-relaxed text-faint text-pretty shadow-[0_0_0_1px_var(--color-line)] max-md:hidden">
        Sample data. The agents arrive in the next stages and fill these screens themselves.
      </p>
    </aside>
  );
}
