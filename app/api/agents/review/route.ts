import { reviewPosts } from "@/lib/agents/review";
import { streamAgent } from "@/lib/agents/stream";
import { briefForWork, currentBrand } from "@/lib/files";
import { missingReviewKeys, savePosts } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Review", missingReviewKeys(), async (step) => {
    const brief = await briefForWork();
    await savePosts(await reviewPosts(await currentBrand(), brief, step));
  });
}
