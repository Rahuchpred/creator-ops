import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { PageHeader, Tile, buttonClass } from "@/components/ui";
import { getBans, getPosts } from "@/lib/store";
import { Leaderboard } from "./leaderboard";

export const metadata: Metadata = { title: "Leaderboard" };

// Read per request. Only program posts count: the ones handed in by link or
// pulled in by hashtag, never the reviewer's test rows or the sample ones.
async function LeaderboardView() {
  const [{ posts, sample }, banned] = await Promise.all([getPosts(), getBans()]);
  const program = sample ? [] : posts.filter((post) => post.submitted);

  if (program.length === 0) {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <Tile color="orange">
          <Trophy strokeWidth={2.25} />
        </Tile>
        <h2 className="mt-4 text-base font-semibold tracking-tight">No program posts yet</h2>
        <p className="mx-auto mt-1 max-w-[46ch] text-sm text-pretty text-muted">
          The leaderboard fills in once creators post for the program. Add the first post by
          its link on the Posts screen, or check the program hashtag there.
        </p>
        <Link href="/posts" className={`${buttonClass({ variant: "primary" })} mt-5`}>
          Open Posts
        </Link>
      </div>
    );
  }

  return <Leaderboard posts={program} banned={banned} />;
}

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="The program's most watched posts and the creators behind them."
      />
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted">
            Loading the leaderboard…
          </p>
        }
      >
        <LeaderboardView />
      </Suspense>
    </>
  );
}
