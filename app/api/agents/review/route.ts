import { postsNote } from "@/lib/agents/notes";
import { reviewPosts } from "@/lib/agents/review";
import { streamAgent } from "@/lib/agents/stream";
import { briefForWork, currentBrand, logRun } from "@/lib/files";
import { missingReviewKeys, savePosts } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Review", missingReviewKeys(), async (step) => {
    const brief = await briefForWork();
    const posts = await reviewPosts(await currentBrand(), brief, step);
    await savePosts(posts);
    await logRun("Review", "the app", postsNote(posts));
  });
}
