import type { Metadata } from "next";
import { Suspense } from "react";
import { getBans, getPosts, getProgram, missingReviewKeys } from "@/lib/store";
import { PostsGrid } from "./posts-grid";
import { PostsHeader } from "./posts-header";

export const metadata: Metadata = { title: "Posts" };

// Read per request, so posts the Marketing agent just reviewed show on refresh.
async function PostsView() {
  const [{ posts, sample }, { brand }, banned] = await Promise.all([
    getPosts(),
    getProgram(),
    getBans(),
  ]);
  const submitted = posts.filter((post) => post.submitted).length;
  return (
    <>
      <PostsHeader
        sample={sample}
        submitted={submitted}
        hashtag={brand.hashtag}
        missingKeys={missingReviewKeys()} />
      {sample || submitted > 0 || posts.length === 0 ? null : (
        <p className="max-w-[70ch] text-sm text-pretty text-muted">
          These are test rows, not posts made for the program. Until a real post is added
          above, the reviewer is tried on the roster creators&apos; own recent TikTok videos.
          Most were never made for the brand and should fail. They clear when the first real
          post is added.
        </p>
      )}
      <PostsGrid posts={posts} banned={banned} canBan={!sample} />
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
