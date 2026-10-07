import { trackHashtag } from "@/lib/agents/review";
import { streamAgent } from "@/lib/agents/stream";
import { briefForWork, currentBrand, logRun, readRoster, saveRoster } from "@/lib/files";
import { missingReviewKeys, savePosts } from "@/lib/store";

export const maxDuration = 300;

// Pulls in posts carrying the program hashtag, reviews the new ones and
// saves them with the other program posts. A creator who has posted counts
// as onboarded.
export async function POST() {
  return streamAgent("Marketing", missingReviewKeys(), async (step) => {
    const brand = await currentBrand();
    const { added, posts } = await trackHashtag(brand, await briefForWork(), step);
    if (added.length === 0) return;
    await savePosts(posts);

    const posted = new Set(added.map((post) => post.handle));
    const roster = await readRoster();
    if (roster?.some((creator) => posted.has(creator.handle))) {
      await saveRoster(
        roster.map((creator) =>
          posted.has(creator.handle) ? { ...creator, status: "Onboarded" as const } : creator,
        ),
      );
    }

    const approved = added.filter((post) => post.status === "Approved").length;
    await logRun(
      "Marketing",
      "the app",
      `Found ${added.length} new ${added.length === 1 ? "post" : "posts"} under #${brand.hashtag}: ${approved} approved, ${added.length - approved} held or rejected.`,
    );
  });
}
