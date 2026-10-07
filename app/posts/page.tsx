import type { Metadata } from "next";
import { Suspense } from "react";
import { getPosts, missingReviewKeys } from "@/lib/store";
import { PostsGrid } from "./posts-grid";
import { PostsHeader } from "./posts-header";

export const metadata: Metadata = { title: "Posts" };

// Read per request, so posts the Review agent just reviewed show on refresh.
async function PostsView() {
  const { posts, sample } = await getPosts();
  return (
    <>
      <PostsHeader sample={sample} missingKeys={missingReviewKeys()} />
      {sample ? null : (
        <p className="max-w-[70ch] text-sm text-pretty text-muted">
          These are not sponsored posts. No program is live yet, so the reviewer is being tested
          on the roster creators&apos; own recent TikTok videos, checked against the brief. Most
          were never made for the brand and should fail.
        </p>
      )}
      <PostsGrid posts={posts} />
    </>
  );
}

export default function PostsPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-muted">
          Loading the posts…
        </p>
      }
    >
      <PostsView />
    </Suspense>
  );
}
