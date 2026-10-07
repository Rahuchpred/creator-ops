// A creator's trust score. Plain arithmetic on the flags their program posts
// already carry, with no I/O and no model: every point lost has a reason a
// person can read.

import type { Post, PostFlag } from "@/lib/data";

// Handles are compared lowercase and without the leading @.
export const handleKey = (handle: string) => handle.trim().replace(/^@/, "").toLowerCase();

// Points, kept together so they are easy to tune once a real program's data
// comes in. They are first guesses, not measured values.
const START = 100; // a creator is trusted until a post says otherwise
const VIEW_SPIKE = 30; // per post: the clearest sign of bought views
const DUPLICATE = 25; // per post: someone else's video handed in as their own
const LOW_ENGAGEMENT = 20; // per post: reach without reactions, weaker than a spike
const UNDER_1000 = 5; // per post: far more often weak content than fake views...
const UNDER_1000_MOST = 15; // ...so it can never cost more than this in total
const NO_DISCLOSURE = 10; // per post: a rules problem, not a fraud one...
const NO_DISCLOSURE_MOST = 20; // ...so it is capped too
const TRUSTED = 85; // at or above this nothing needs a second look. One fraud flag lands under it
const WATCH = 50; // from here up to Trusted, read the reasons before paying

export type TrustLevel = "Trusted" | "Watch" | "At risk" | "Banned";

export type TrustReason = {
  // "fraud" doubts the views, "rules" is a broken program rule, "ban" is a
  // person's own call.
  kind: "fraud" | "rules" | "ban";
  text: string;
  // Points this reason took off the score.
  points: number;
};

export type Trust = {
  score: number;
  level: TrustLevel;
  // How many program posts the score was worked out from.
  posts: number;
  reasons: TrustReason[];
};

type Flag = NonNullable<PostFlag>;

// Reviewed posts carry their own flag list. Sample rows only have the one.
export const flagsOf = (post: Pick<Post, "flag" | "flags">): Flag[] =>
  post.flags ?? (post.flag ? [post.flag] : []);

const posts = (count: number, one: string, many: string) =>
  count === 1 ? `1 post ${one}` : `${count} posts ${many}`;

export const trustLevel = (score: number): Exclude<TrustLevel, "Banned"> =>
  score >= TRUSTED ? "Trusted" : score >= WATCH ? "Watch" : "At risk";

// `creatorPosts` are one creator's posts. Only program posts count, so a
// test row never moves a score. The score starts at 100, each flag takes its
// points off, and it never goes under 0. A banned creator is 0 whatever
// their posts say.
export function trustFor(creatorPosts: Post[], banned = false): Trust {
  const program = creatorPosts.filter((post) => post.submitted);
  const count = (flag: Flag) => program.filter((post) => flagsOf(post).includes(flag)).length;

  const spikes = count("View spike");
  const copies = count("Duplicate");
  const quiet = count("Low engagement");
  const small = count("Under 1,000 views");
  const unmarked = count("No disclosure");

  const reasons: TrustReason[] = [
    spikes > 0 && {
      kind: "fraud" as const,
      text: `${posts(spikes, "has", "have")} far more views than this creator usually gets, with much weaker engagement`,
      points: spikes * VIEW_SPIKE,
    },
    copies > 0 && {
      kind: "fraud" as const,
      text: `${posts(copies, "matches", "match")} a video another creator already handed in`,
      points: copies * DUPLICATE,
    },
    quiet > 0 && {
      kind: "fraud" as const,
      text: `${posts(quiet, "has", "have")} a lot of views and very few likes, comments or shares`,
      points: quiet * LOW_ENGAGEMENT,
    },
    small > 0 && {
      kind: "fraud" as const,
      text: `${posts(small, "is", "are")} under 1,000 views, which is more often weak content than fake views`,
      points: Math.min(small * UNDER_1000, UNDER_1000_MOST),
    },
    unmarked > 0 && {
      kind: "rules" as const,
      text: `${posts(unmarked, "is", "are")} not marked as a paid partnership. That breaks a program rule and says nothing about the views`,
      points: Math.min(unmarked * NO_DISCLOSURE, NO_DISCLOSURE_MOST),
    },
  ].filter((reason) => reason !== false);

  const lost = reasons.reduce((sum, reason) => sum + reason.points, 0);
  const score = Math.max(0, START - lost);

  if (banned) {
    return {
      score: 0,
      level: "Banned",
      posts: program.length,
      reasons: [
        { kind: "ban", text: "Banned from the program by a person", points: START },
        ...reasons,
      ],
    };
  }
  return { score, level: trustLevel(score), posts: program.length, reasons };
}
