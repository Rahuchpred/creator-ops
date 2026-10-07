"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// The public pages run edge to edge with no app chrome: the landing page
// and the page a brand shares with its creators.
export const isPublic = (pathname: string) =>
  pathname.startsWith("/welcome") || pathname === "/creators" || pathname.startsWith("/creators/");

// The padded column every app screen sits in.
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isPublic(pathname)) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-10 md:py-12">
      {children}
    </div>
  );
}
