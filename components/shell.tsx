"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// The public landing page runs edge to edge with no app chrome.
export const isPublic = (pathname: string) => pathname.startsWith("/welcome");

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
