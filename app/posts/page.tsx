import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge, Handle, tableClass as t } from "@/components/ui";
import { payoutForPost, type Post } from "@/lib/data";
import { formatDay, formatMoney, formatNumber } from "@/lib/format";
import { getPosts, missingReviewKeys } from "@/lib/store";
import { PostsHeader } from "./posts-header";

export const metadata: Metadata = { title: "Posts" };

const statusTone = {
  Approved: "good",
  "In review": "brand",
  Rejected: "bad",
} as const satisfies Record<Post["status"], string>;

// Reviewed posts carry their own flag list. Sample rows only have the one.
const flagsOf = (post: Post) => post.flags ?? (post.flag ? [post.flag] : []);

function earns(post: Post) {
  if (post.status === "Rejected") return "Nothing";
  if (post.status === "In review") return "None yet";
  return formatMoney(post.payout ?? payoutForPost(post));
}

function PostsTable({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <p className="card p-10 text-center text-sm text-muted">
        No posts have been reviewed. Press Review posts to run the Review agent.
      </p>
    );
  }

  return (
    <div className={t.wrap}>
      <table className={t.table}>
        <thead>
          <tr>
            <th scope="col" className={t.th}>Creator</th>
            <th scope="col" className={t.th}>Post</th>
            <th scope="col" className={t.thRight}>Views</th>
            <th scope="col" className={t.thRight}>Brief score</th>
            <th scope="col" className={t.thRight}>Earns</th>
            <th scope="col" className={t.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className={t.row}>
              <td className={t.td}>
                <Handle handle={post.handle} name={post.name ?? post.platform} />
              </td>
              <td className={`${t.td} max-w-[340px] min-w-[260px] py-3`}>
                {post.url ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate underline decoration-line underline-offset-4 hover:decoration-ink"
                  >
                    {post.caption || "No caption"}
                  </a>
                ) : (
                  <div className="truncate">{post.caption || "No caption"}</div>
                )}
                {post.feedback ? (
                  <div className="mt-0.5 text-xs text-pretty text-muted">{post.feedback}</div>
                ) : null}
                {post.postedAt ? (
                  <div className="text-xs text-faint">{formatDay(post.postedAt)}</div>
                ) : null}
              </td>
              <td className={t.tdRight}>{formatNumber(post.views)}</td>
              <td className={t.tdRight}>{post.briefScore}</td>
              <td className={t.tdRight}>{earns(post)}</td>
              <td className={`${t.td} py-3`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={statusTone[post.status]}>{post.status}</Badge>
                  {flagsOf(post).map((flag) => (
                    <Badge key={flag} tone="warn">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
      <PostsTable posts={posts} />
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
