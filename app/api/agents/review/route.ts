import { reviewPosts } from "@/lib/agents/review";
import { streamAgent } from "@/lib/agents/stream";
import { brand, brief as sampleBrief } from "@/lib/data";
import { readBrief } from "@/lib/files";
import { missingReviewKeys, savePosts } from "@/lib/store";

export const maxDuration = 300;

export async function POST() {
  return streamAgent("Review", missingReviewKeys(), async (step) => {
    const brief = (await readBrief()) ?? sampleBrief;
    await savePosts(await reviewPosts(brand, brief, step));
  });
}
