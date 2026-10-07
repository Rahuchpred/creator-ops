import { z } from "zod";
import { streamAgent } from "@/lib/agents/stream";
import { submitLink } from "@/lib/review/submit";
import { missingReviewKeys } from "@/lib/store";

export const maxDuration = 300;

const Body = z.object({ link: z.string().trim().min(1).max(500) });

// Reviews one posted video from its link and saves it with the other
// handed-in posts.
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json(
      { type: "error", message: "Paste the link to the posted video." },
      { status: 400 },
    );
  }

  return streamAgent("Marketing", missingReviewKeys(), async (step) => {
    await submitLink(body.data.link, step);
  });
}
