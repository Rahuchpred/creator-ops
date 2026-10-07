// What the public creator page is allowed to show. A creator sees their own
// handed-in videos in plain words, and never the checks behind a verdict,
// the roster or anyone else's posts.

import type { Brand, Post, PostStatus } from "@/lib/data";
import type { PayoutApproval } from "@/lib/files";
import { payoutApproved, payoutFor } from "@/lib/review/checks";

export type CreatorVideo = {
  id: string;
  handle: string;
  caption: string;
  postedAt: string;
  views: number;
  status: PostStatus;
  cover?: string;
  url?: string;
  // The reviewer's one sentence to the creator.
  feedback?: string;
  // Dollars this video has earned so far. Nothing unless it is approved.
  earned: number;
  // Whether a person at the brand has signed off on that amount.
  payoutApproved: boolean;
  // The one check a creator can fix themselves, so it is said out loud.
  missingLabel: boolean;
};

const HANDLE = /^[a-z0-9_.]{1,40}$/;

// A typed handle, lowercase and without the @. Null when it could not be a
// TikTok handle, so it is never matched against saved posts.
export function cleanHandle(typed: string | undefined): string | null {
  const handle = (typed ?? "").trim().replace(/^@/, "").toLowerCase();
  return HANDLE.test(handle) ? handle : null;
}

export function creatorVideo(post: Post, brand: Brand, approvals: PayoutApproval[]): CreatorVideo {
  const earned = post.status === "Approved" ? (post.payout ?? payoutFor(post, brand)) : 0;
  return {
    id: post.id,
    handle: post.handle,
    caption: post.caption,
    postedAt: post.postedAt,
    views: post.views,
    status: post.status,
    cover: post.cover,
    url: post.url,
    feedback: post.feedback,
    earned,
    payoutApproved: earned > 0 && payoutApproved(post, approvals),
    missingLabel: (post.flags ?? (post.flag ? [post.flag] : [])).includes("No disclosure"),
  };
}

// One creator's handed-in videos, newest first. Test rows and other
// creators' posts never pass.
export function videosFor(
  handle: string,
  posts: Post[],
  brand: Brand,
  approvals: PayoutApproval[],
): CreatorVideo[] {
  return posts
    .filter((post) => post.submitted && post.handle.toLowerCase() === handle)
    .map((post) => creatorVideo(post, brand, approvals))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}
