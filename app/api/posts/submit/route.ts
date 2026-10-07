import { z } from "zod";
import { reviewLink } from "@/lib/agents/review";
import { streamAgent } from "@/lib/agents/stream";
import { briefForWork, currentBrand, logHandoff, readRoster, saveRoster } from "@/lib/files";
import { missingReviewKeys, savePosts } from "@/lib/store";

export const maxDuration = 300;

const Body = z.object({ link: z.string().trim().min(1).max(500) });

// Reviews one posted video from its link and saves it with the other
// handed-in posts. A creator who has posted counts as onboarded.
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json(
      { type: "error", message: "Paste the link to the posted video." },
      { status: 400 },
    );
  }

  return streamAgent("Review", missingReviewKeys(), async (step) => {
    const brief = await briefForWork();
    const { post, posts } = await reviewLink(await currentBrand(), brief, body.data.link, step);
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
      from: "Review",
      to: "the app",
      note: `Reviewed a post by @${post.handle}: ${post.status}, brief score ${post.briefScore}, ${post.views.toLocaleString("en-US")} views.`,
    });
  });
}
