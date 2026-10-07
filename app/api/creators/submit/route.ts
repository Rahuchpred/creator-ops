import { z } from "zod";
import { streamAgent } from "@/lib/agents/stream";
import { creatorVideo } from "@/lib/creators";
import { currentBrand, currentBrief, isBanned, readPayoutApprovals } from "@/lib/files";
import { readVideoLink } from "@/lib/review/link";
import { submitLink } from "@/lib/review/submit";
import { missingReviewKeys } from "@/lib/store";

export const maxDuration = 300;

const Body = z.object({ link: z.string().trim().min(1).max(500) });

// The page is public and each check costs a few cents, so checks are
// capped: a handful per visitor an hour, and a ceiling for everyone a day.
// Counted in memory, which is enough for one small server.
const PER_VISITOR_AN_HOUR = 5;
const FOR_EVERYONE_A_DAY = 60;
const recent: { who: string; at: number }[] = [];

function overLimit(who: string): boolean {
  const now = Date.now();
  while (recent.length > 0 && now - recent[0].at > 86_400_000) recent.shift();
  if (recent.length >= FOR_EVERYONE_A_DAY) return true;
  const mine = recent.filter((check) => check.who === who && now - check.at < 3_600_000);
  if (mine.length >= PER_VISITOR_AN_HOUR) return true;
  recent.push({ who, at: now });
  return false;
}

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

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (overLimit(visitor)) {
    return refuse("Too many videos were checked just now. Try again in an hour.", 429);
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
