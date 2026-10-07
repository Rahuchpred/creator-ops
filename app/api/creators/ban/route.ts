import { z } from "zod";
import type { Post } from "@/lib/data";
import { readBans, readPosts, saveBans, savePosts } from "@/lib/files";
import { handleKey } from "@/lib/review/trust";

const Body = z.object({
  handle: z.string().trim().min(1).max(100),
  banned: z.boolean(),
});

// A person bans a creator from the program, or lifts the ban.
//
// A ban rejects every saved post by that creator and sets what it earns to
// 0. A post the ban had to change is marked as the person's call, so a later
// review leaves it rejected. Lifting a ban gives nothing back: it only lets
// the creator hand in posts again.
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json(
      { message: "Send the creator and whether they are banned." },
      { status: 400 },
    );
  }

  const handle = handleKey(body.data.handle);
  const bans = await readBans();
  const others = bans.filter((ban) => ban.handle !== handle);

  if (!body.data.banned) {
    if (others.length !== bans.length) await saveBans(others);
    return Response.json({ handle, banned: false, posts: [] });
  }

  if (others.length === bans.length) {
    await saveBans([{ handle, bannedAt: new Date().toISOString() }, ...bans]);
  }

  const posts = (await readPosts()) ?? [];
  const theirs = (post: Post) => handleKey(post.handle) === handle;
  const settled = (post: Post) => post.status === "Rejected" && (post.payout ?? 0) === 0;
  const next = posts.map((post): Post =>
    theirs(post) && !settled(post)
      ? { ...post, status: "Rejected", payout: 0, decidedBy: "person" }
      : post,
  );
  // Nothing is written when every post was already rejected.
  if (posts.some((post) => theirs(post) && !settled(post))) await savePosts(next);
  return Response.json({ handle, banned: true, posts: next.filter(theirs) });
}
