import type { Brief, Creator, Post } from "@/lib/data";
import type { Outreach } from "@/lib/files";
import { summarize } from "@/lib/review/checks";

// The one-line result of a finished run, as it reads on the Activity screen.
// Shared by the app's buttons and the MCP server so both word it the same.

export const briefNote = (brief: Brief) => `Brief saved: ${brief.goal}`;

export function rosterNote(roster: Creator[]) {
  const count = (status: Creator["status"]) =>
    roster.filter((creator) => creator.status === status).length;
  return `Roster saved: ${count("Suggested")} suggested, ${count("Rejected")} rejected`;
}

export const draftsNote = (drafts: Outreach[]) =>
  `Outreach saved: ${drafts.length === 1 ? "1 new draft is" : `${drafts.length} new drafts are`} waiting for approval`;

export function postsNote(posts: Post[]) {
  const { approved, inReview, rejected } = summarize(posts);
  return `Posts reviewed: ${approved} approved, ${inReview} in review, ${rejected} rejected`;
}
