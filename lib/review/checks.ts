// Post checks, verdicts and payouts. Everything here is plain arithmetic on
// fetched data, with no I/O. The model scores a post against the brief, but
// it never produces a flag, a verdict or an amount, so every row can be
// audited.

import type { Brand, Payout, Post, PostFlag, PostStatus } from "@/lib/data";
import type { PayoutApproval } from "@/lib/files";
import type { FetchedPost } from "@/lib/research/metrics";
import { handleKey } from "@/lib/review/trust";

export type ReviewFlag = NonNullable<PostFlag>;

// Thresholds, kept together so they are easy to tune once a real program's
// data comes in. They are first guesses, not measured values.
const SPIKE_RATIO = 15; // a post at 15x the creator's median views...
const SPIKE_ENGAGEMENT_DROP = 0.4; // ...with under 40% of their usual engagement
const LOW_ENGAGEMENT = 0.01; // under 1% engagement on a post with real reach
const LOW_ENGAGEMENT_MIN_VIEWS = 10_000;
const SHADOW_BAN_VIEWS = 1_000; // the playbook's line for a shadow ban or weak content
const MIN_BRIEF_SCORE = 50; // below this the post does not clearly follow the brief
const CLEAR_MISS = 35; // below this it plainly does not, and nobody needs to look
const DUPLICATE_MIN_CAPTION = 12; // shorter captions ("#ad") match by chance too often

// The brand's hard rule: every post is marked as a paid partnership. The
// platform's own label arrives as `isAd`, so only the caption tags are
// matched here. The lookahead keeps #adhd and #partnership from counting.
const DISCLOSURE_TAG = /#(ad|sponsored|partner)(?![a-z0-9_])/i;

// Most serious first. The first flag a post carries goes in its single
// `flag` field, and summaries name flags in this order.
export const FLAG_ORDER: ReviewFlag[] = [
  "No disclosure",
  "Duplicate",
  "View spike",
  "Low engagement",
  "Under 1,000 views",
];

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const engagementRate = (post: FetchedPost) =>
  post.views ? (post.likes + post.comments + post.shares) / post.views : 0;

export const hasDisclosure = (post: FetchedPost) => post.isAd || DISCLOSURE_TAG.test(post.caption);

// `others` are the same creator's other posts. They set what is normal for
// this creator, so the post under review never moves its own baseline.
export function flagsFor(post: FetchedPost, others: FetchedPost[]): ReviewFlag[] {
  const flags = new Set<ReviewFlag>();
  const rate = engagementRate(post);

  if (!hasDisclosure(post)) flags.add("No disclosure");

  const baseline = others.filter((other) => other.views > 0);
  if (baseline.length > 0) {
    const medianViews = median(baseline.map((other) => other.views));
    const medianRate = median(baseline.map(engagementRate));
    if (post.views >= SPIKE_RATIO * medianViews && rate < SPIKE_ENGAGEMENT_DROP * medianRate) {
      flags.add("View spike");
    }
  }
  if (post.views >= LOW_ENGAGEMENT_MIN_VIEWS && rate < LOW_ENGAGEMENT) {
    flags.add("Low engagement");
  }
  if (post.views < SHADOW_BAN_VIEWS) flags.add("Under 1,000 views");

  return FLAG_ORDER.filter((flag) => flags.has(flag));
}

const sameText = (caption: string) => caption.trim().toLowerCase().replace(/\s+/g, " ");

// The saved post this one copies, if any. Two things count:
//
// 1. The same video id saved under a different creator.
// 2. The same caption, letter for letter once case and spacing are evened
//    out, and the same length in whole seconds, on a post by a different
//    creator. The caption has to be at least 12 characters, and both posts
//    need a known length.
//
// The post that went up first is the original, so a post dated before its
// match is not the copy. On the same day both are flagged and a person
// decides. The same creator handing the same video in twice is not a
// duplicate: the saved row is refreshed, so it can never be paid twice.
export function duplicateOf(
  post: Pick<Post, "id" | "handle" | "caption" | "postedAt" | "durationSeconds">,
  saved: Post[],
): Post | undefined {
  const text = sameText(post.caption);
  const seconds = post.durationSeconds === undefined ? null : Math.round(post.durationSeconds);
  return saved.find((other) => {
    if (handleKey(other.handle) === handleKey(post.handle)) return false;
    if (other.id === post.id) return true;
    if (text.length < DUPLICATE_MIN_CAPTION || seconds === null) return false;
    if (other.durationSeconds === undefined || Math.round(other.durationSeconds) !== seconds) {
      return false;
    }
    if (sameText(other.caption) !== text) return false;
    return !(post.postedAt && other.postedAt && post.postedAt < other.postedAt);
  });
}

// Adds "Duplicate" to a post's flags, keeping the most serious first.
export const withDuplicate = (flags: ReviewFlag[]): ReviewFlag[] =>
  FLAG_ORDER.filter((flag) => flag === "Duplicate" || flags.includes(flag));

// `briefScore` is the model's 0 to 100 judgment of how well the post follows
// the brief. The checks run in this order and the first one that applies
// wins:
//
// 1. No disclosure: Rejected. It is the brand's hard rule and a plain fact
//    about the post, so there is nothing for a person to weigh.
// 2. Brief score under 35: Rejected. A post that plainly does not follow
//    the brief is not paid however real its views are.
// 3. Brief score from 35 to 49: In review. It follows part of the brief,
//    and a person who can watch the video makes the call.
// 4. View spike, Low engagement or Duplicate: In review. The post follows
//    the brief but its views may not be real, or the video may be someone
//    else's, and a person decides before money moves.
// 5. Otherwise: Approved.
//
// So any of the four blocking flags keeps a post from "Approved" whatever
// its score, and the model cannot talk a post past them. "Under 1,000 views"
// is a signal for the person reading, not a blocker: such a post is far
// below the brand's minimum views and earns nothing either way.
export function verdictFor(briefScore: number, flags: ReviewFlag[]): PostStatus {
  if (flags.includes("No disclosure")) return "Rejected";
  if (briefScore < CLEAR_MISS) return "Rejected";
  if (briefScore < MIN_BRIEF_SCORE) return "In review";
  if (flags.includes("View spike") || flags.includes("Low engagement")) return "In review";
  if (flags.includes("Duplicate")) return "In review";
  return "Approved";
}

// What one post earns, in dollars and whole cents. Nothing unless it is
// approved and has reached the brand's minimum views.
export function payoutFor(post: Pick<Post, "status" | "views">, brand: Brand): number {
  if (post.status !== "Approved" || post.views < brand.minimumViews) return 0;
  const earned = (post.views / 1000) * brand.ratePerThousandViews;
  return Math.round(Math.min(earned, brand.payoutCapPerPost) * 100) / 100;
}

// One payout row per creator with approved posts that earned something.
// An approved post under the minimum views earns nothing, so it is left out
// of the count and the views the row is paid for.
export function payoutsFrom(posts: Post[]): Payout[] {
  const rows = new Map<string, Payout>();
  for (const post of posts) {
    const amount = post.payout ?? 0;
    if (post.status !== "Approved" || amount <= 0) continue;
    const row = rows.get(post.handle) ?? {
      handle: post.handle,
      posts: 0,
      views: 0,
      amount: 0,
      status: "Awaiting approval",
    };
    rows.set(post.handle, {
      ...row,
      posts: row.posts + 1,
      views: row.views + post.views,
      amount: Math.round((row.amount + amount) * 100) / 100,
    });
  }
  return [...rows.values()].sort((a, b) => b.amount - a.amount);
}

// Whether a person has approved what this post earns. An approval is for one
// amount, so it stops counting when a later review changes the payout.
export const payoutApproved = (post: Post, approvals: PayoutApproval[]) =>
  approvals.some((approval) => approval.postId === post.id && approval.amount === post.payout);

// The payout rows split by whether a person has approved them. A creator
// with an approved post and a newer unapproved one has a row in each list.
export function payoutsByApproval(posts: Post[], approvals: PayoutApproval[]) {
  const approved = (post: Post) => payoutApproved(post, approvals);
  return {
    waiting: payoutsFrom(posts.filter((post) => !approved(post))),
    approved: payoutsFrom(posts.filter(approved)).map(
      (row) => ({ ...row, status: "Approved" }) satisfies Payout,
    ),
  };
}

export type ReviewSummary = {
  approved: number;
  inReview: number;
  rejected: number;
  totalPayout: number;
  // The two most serious flags that came up, with how many posts carry each.
  topFlags: { flag: ReviewFlag; posts: number }[];
};

export function summarize(posts: Post[]): ReviewSummary {
  const count = (status: PostStatus) => posts.filter((post) => post.status === status).length;
  return {
    approved: count("Approved"),
    inReview: count("In review"),
    rejected: count("Rejected"),
    totalPayout:
      Math.round(posts.reduce((sum, post) => sum + (post.payout ?? 0), 0) * 100) / 100,
    topFlags: FLAG_ORDER.map((flag) => ({
      flag,
      posts: posts.filter((post) => post.flags?.includes(flag)).length,
    }))
      .filter((entry) => entry.posts > 0)
      .slice(0, 2),
  };
}
