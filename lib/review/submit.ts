import { reviewLink } from "@/lib/agents/review";
import type { Post } from "@/lib/data";
import {
  briefForWork,
  currentBrand,
  logHandoff,
  readRoster,
  savePosts,
  saveRoster,
} from "@/lib/files";

// Reviews one posted video from its link and saves it with the other
// handed-in posts. A creator who has posted counts as onboarded. The brand's
// Posts screen and the public creator page both hand in through here.
export async function submitLink(link: string, step: (label: string) => void): Promise<Post> {
  const brief = await briefForWork();
  const { post, posts } = await reviewLink(await currentBrand(), brief, link, step);
  await savePosts(posts);

  const roster = await readRoster();
  if (roster?.some((creator) => creator.handle === post.handle)) {
    await saveRoster(
      roster.map((creator) =>
        creator.handle === post.handle ? { ...creator, status: "Onboarded" as const } : creator,
      ),
    );
  }

  await logHandoff({
    at: new Date().toISOString(),
    from: "Marketing",
    to: "the app",
    note: `Reviewed a post by @${post.handle}: ${post.status}, brief score ${post.briefScore}, ${post.views.toLocaleString("en-US")} views.`,
  });
  return post;
}
