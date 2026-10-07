import { z } from "zod";
import { currentBrand, isBanned, readPosts } from "@/lib/files";
import { payoutFor } from "@/lib/review/checks";
import { savePosts } from "@/lib/store";

const Body = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["Approved", "Rejected"]),
});

// A person's final call on one post. The payout follows from it, worked out
// the same way as for any other post.
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ message: "Send the post and the decision." }, { status: 400 });
  }

  const posts = (await readPosts()) ?? [];
  const post = posts.find((row) => row.id === body.data.id);
  if (!post) {
    return Response.json(
      { message: "That post is no longer saved. Refresh the page and try again." },
      { status: 404 },
    );
  }

  const status = body.data.status;
  // A banned creator is never paid. The ban is lifted first.
  if (status === "Approved" && (await isBanned(post.handle))) {
    return Response.json(
      { message: `@${post.handle} is banned from this program. Unban them before approving a post.` },
      { status: 409 },
    );
  }
  const decided = {
    ...post,
    status,
    decidedBy: "person" as const,
    payout: payoutFor({ status, views: post.views }, await currentBrand()),
  };
  await savePosts(posts.map((row) => (row.id === post.id ? decided : row)));
  return Response.json(decided);
}
