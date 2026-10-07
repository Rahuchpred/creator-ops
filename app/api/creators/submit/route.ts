import { z } from "zod";
import { streamAgent } from "@/lib/agents/stream";
import { creatorVideo } from "@/lib/creators";
import { currentBrand, currentBrief, isBanned, readPayoutApprovals } from "@/lib/files";
import { readVideoLink } from "@/lib/review/link";
import { submitLink } from "@/lib/review/submit";
import { missingReviewKeys } from "@/lib/store";

export const maxDuration = 300;

const Body = z.object({ link: z.string().trim().min(1).max(500) });

const refuse = (message: string, status = 400) =>
  Response.json({ type: "error", message }, { status });

// A creator hands in their own video from the public creator page. It runs
// the same review as the brand's Posts screen and saves the same way. The
// finished stream carries that one video, in the words a creator sees.
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return refuse("Paste the link to your posted video.");

  // Setup problems are the brand's to fix, so a creator is told plainly and
  // never shown key names.
  if (missingReviewKeys().length > 0) {
    return refuse("Video checks are not switched on for this program yet. Ask the brand.", 503);
  }
  if (!(await currentBrief())) {
    return refuse("The brief is not written yet, so videos cannot be checked. Try again later.", 409);
  }

  return streamAgent("Marketing", [], async (step) => {
    step("Reading the link");
    const { handle } = await readVideoLink(body.data.link);
    if (await isBanned(handle)) {
      throw new Error(
        `@${handle} has been removed from this program, so new videos cannot be handed in. Contact the brand if you think this is a mistake.`,
      );
    }

    const post = await submitLink(body.data.link, (label) => {
      // Already said above, and the result sits under the steps here.
      if (label === "Reading the link") return;
      step(label.replace(". Open it to see why", ". The details are below"));
    });
    return creatorVideo(post, await currentBrand(), await readPayoutApprovals());
  });
}
