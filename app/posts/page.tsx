import type { Metadata } from "next";
import { Badge, Handle, PageHeader, tableClass as t } from "@/components/ui";
import { payoutForPost, posts, type Post } from "@/lib/data";
import { formatDay, formatMoney, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Posts" };

const statusTone = {
  Approved: "good",
  "In review": "brand",
  Rejected: "bad",
} as const satisfies Record<Post["status"], string>;

export default function PostsPage() {
  return (
    <>
      <PageHeader
        title="Posts"
        description="Every video creators have posted, scored against the brief. Flagged posts wait for a person."
      />

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
                  <Handle handle={post.handle} name={post.platform} />
                </td>
                <td className={`${t.td} max-w-[260px]`}>
                  <div className="truncate">{post.caption}</div>
                  <div className="text-xs text-faint">{formatDay(post.postedAt)}</div>
                </td>
                <td className={t.tdRight}>{formatNumber(post.views)}</td>
                <td className={t.tdRight}>{post.briefScore}</td>
                <td className={t.tdRight}>
                  {post.status === "Approved" ? formatMoney(payoutForPost(post)) : "None yet"}
                </td>
                <td className={t.td}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={statusTone[post.status]}>{post.status}</Badge>
                    {post.flag ? <Badge tone="warn">{post.flag}</Badge> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
