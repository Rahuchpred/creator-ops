"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  FileText,
  LayoutGrid,
  MessageCircleQuestion,
  MessagesSquare,
  Send,
  SlidersHorizontal,
  Users,
  Wallet,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { isPublic } from "@/components/shell";
import { cx } from "@/lib/format";

const groups = [
  {
    label: "Program",
    links: [
      { href: "/", label: "Overview", icon: LayoutGrid },
      { href: "/program", label: "Setup", icon: SlidersHorizontal },
      { href: "/brief", label: "Brief", icon: FileText },
    ],
  },
  {
    label: "Creators",
    links: [
      { href: "/roster", label: "Roster", icon: Users },
      { href: "/outreach", label: "Outreach", icon: Send },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/posts", label: "Posts", icon: Clapperboard },
      { href: "/payouts", label: "Payouts", icon: Wallet },
    ],
  },
  {
    label: "Team",
    links: [
      { href: "/activity", label: "Activity", icon: MessagesSquare },
      { href: "/ask", label: "Ask the team", icon: MessageCircleQuestion },
    ],
  },
];

export function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  if (isPublic(pathname)) return null;

  return (
    <aside className="flex shrink-0 flex-col gap-3 border-line bg-surface p-3 max-md:border-b md:sticky md:top-0 md:h-dvh md:w-64 md:gap-6 md:overflow-y-auto md:border-r md:p-4">
      <div className="flex items-center gap-3 px-1.5 md:pt-1.5">
        <span
          aria-hidden="true"
          className="brand-fill grid size-8 place-items-center rounded-[10px]"
        >
          <LogoMark className="size-5 text-white" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold tracking-tight">{name}</div>
          <div className="truncate text-xs text-faint">Creator program</div>
        </div>
      </div>

      {/* The padding and negative margin leave room for the focus ring inside the scroller.
          On phones the groups dissolve into one row of links. */}
      <nav
        aria-label="Screens"
        className="-m-1 flex gap-1 overflow-x-auto p-1 [scrollbar-width:none] md:flex-col md:gap-5 md:overflow-visible"
      >
        {groups.map((group) => (
          <div
            key={group.label}
            role="group"
            aria-label={group.label}
            className="flex gap-1 max-md:contents md:flex-col"
          >
            <div aria-hidden="true" className="px-3.5 pb-1 text-xs font-medium text-faint max-md:hidden">
              {group.label}
            </div>
            {group.links.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "press flex h-10 shrink-0 items-center gap-3 rounded-full px-3.5 text-sm font-medium",
                    active ? "bg-fill text-ink" : "text-muted hover:bg-fill/70 hover:text-ink",
                  )}
                >
                  <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
