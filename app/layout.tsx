import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { Sidebar } from "@/components/sidebar";
import { getProgram } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Creator Ops", template: "%s - Creator Ops" },
  description: "Run a creator program: the brief, the roster, the posts and the payouts.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

// The brand name comes from the saved program, read per request.
async function NamedSidebar() {
  const { brand } = await getProgram();
  return <Sidebar name={brand.name} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      {/* isolate keeps Base UI popups above the page without z-index fights */}
      <body className="isolate flex min-h-full flex-col md:flex-row">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-10 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow-[0_0_0_1px_var(--color-line)]"
        >
          Skip to content
        </a>
        <Suspense fallback={<Sidebar name="" />}>
          <NamedSidebar />
        </Suspense>
        <main id="main" className="min-w-0 flex-1">
          <Shell>{children}</Shell>
        </main>
      </body>
    </html>
  );
}
