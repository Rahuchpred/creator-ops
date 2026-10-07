// Creator numbers, fraud signals and scores. Everything here is plain
// arithmetic on fetched data. The model judges fit, but it never produces a
// number that ends up on the roster, so every row can be audited.

import type { Brand } from "@/lib/data";

export type FetchedPost = {
  url?: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isAd: boolean;
};

export type FetchedCreator = {
  handle: string;
  name: string;
  bio: string;
  language: string;
  followers: number;
  following: number;
  posts: FetchedPost[];
};

export type FraudFlag =
  | "Low engagement"
  | "View spike"
  | "Odd comment ratio"
  | "Inactive audience"
  | "Follow for follow"
  | "No recent posts";

export type Metrics = {
  postCount: number;
  medianViews: number;
  engagementRate: number;
  viewsPerFollower: number;
  consistency: number;
  postsPerWeek: number;
  fraudRisk: number;
  flags: FraudFlag[];
};

export type Verdict = "shortlist" | "maybe" | "reject";

// Fraud thresholds, kept together so they are easy to tune once a real
// program's data comes in. They are first guesses, not measured values.
const LOW_ENGAGEMENT = 0.01; // under 1% engagement on posts with real reach
const LOW_ENGAGEMENT_MIN_VIEWS = 10_000;
const SPIKE_RATIO = 15; // a post at 15x the creator's median views...
const SPIKE_ENGAGEMENT_DROP = 0.4; // ...with under 40% of their usual engagement
const COMMENT_LIKE_HIGH = 0.25;
const COMMENT_LIKE_LOW = 0.002;
const INACTIVE_FOLLOWERS = 50_000;
const INACTIVE_VIEWS_PER_FOLLOWER = 0.02;
const FOLLOW_BACK_RATIO = 0.8;
const FOLLOW_BACK_MIN = 5_000;

const FLAG_WEIGHT: Record<FraudFlag, number> = {
  "Low engagement": 0.45,
  "View spike": 0.35,
  "Odd comment ratio": 0.25,
  "Inactive audience": 0.35,
  "Follow for follow": 0.2,
  "No recent posts": 0.5,
};

// Fit carries the most weight: strong numbers do not make up for a creator
// whose audience is not the brand's.
const WEIGHTS = { fit: 0.55, performance: 0.25, reliability: 0.2 };
const MIN_FIT = 40; // below this the content does not match the brief
const FRAUD_PENALTY = 0.6;
const REJECT_FRAUD_RISK = 0.6;
const SHORTLIST_SCORE = 60;
const MAYBE_SCORE = 40;
const MIN_POSTS_PER_WEEK = 0.5;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const engagement = (post: FetchedPost) =>
  post.views ? (post.likes + post.comments + post.shares) / post.views : 0;

export function computeMetrics(creator: FetchedCreator): Metrics {
  const posts = creator.posts.filter((post) => post.views > 0);
  if (posts.length === 0) {
    return {
      postCount: 0,
      medianViews: 0,
      engagementRate: 0,
      viewsPerFollower: 0,
      consistency: 0,
      postsPerWeek: 0,
      fraudRisk: FLAG_WEIGHT["No recent posts"],
      flags: ["No recent posts"],
    };
  }

  const views = posts.map((post) => post.views);
  const medianViews = median(views);
  const rates = posts.map(engagement);
  const medianRate = median(rates);

  // Share of posts within 3x of the median either way.
  const consistency =
    views.filter((count) => count >= medianViews / 3 && count <= medianViews * 3).length /
    views.length;

  const times = posts.map((post) => Date.parse(post.createdAt)).filter(Number.isFinite);
  const spanDays = times.length
    ? Math.max((Math.max(...times) - Math.min(...times)) / 86_400_000, 7)
    : 7;
  const postsPerWeek = posts.length / (spanDays / 7);

  const flags: FraudFlag[] = [];
  if (medianRate < LOW_ENGAGEMENT && medianViews >= LOW_ENGAGEMENT_MIN_VIEWS) {
    flags.push("Low engagement");
  }
  if (
    posts.some(
      (post, index) =>
        post.views >= SPIKE_RATIO * medianViews &&
        rates[index] < SPIKE_ENGAGEMENT_DROP * medianRate,
    )
  ) {
    flags.push("View spike");
  }
  const likes = posts.reduce((sum, post) => sum + post.likes, 0);
  const comments = posts.reduce((sum, post) => sum + post.comments, 0);
  if (likes >= 500) {
    const ratio = comments / likes;
    if (ratio > COMMENT_LIKE_HIGH || ratio < COMMENT_LIKE_LOW) flags.push("Odd comment ratio");
  }
  const viewsPerFollower = creator.followers ? medianViews / creator.followers : 0;
  if (creator.followers >= INACTIVE_FOLLOWERS && viewsPerFollower < INACTIVE_VIEWS_PER_FOLLOWER) {
    flags.push("Inactive audience");
  }
  if (
    creator.followers >= FOLLOW_BACK_MIN &&
    creator.following >= FOLLOW_BACK_RATIO * creator.followers
  ) {
    flags.push("Follow for follow");
  }

  return {
    postCount: posts.length,
    medianViews: Math.round(medianViews),
    engagementRate: medianRate,
    viewsPerFollower,
    consistency,
    postsPerWeek,
    fraudRisk: Math.min(1, flags.reduce((sum, flag) => sum + FLAG_WEIGHT[flag], 0)),
    flags,
  };
}

// 1 inside the brand's follower range, falling to 0 at about 3x outside it.
export function followerFit(followers: number, brand: Brand): number {
  const { min, max } = brand.creatorFollowers;
  const count = Math.max(followers, 1);
  if (count >= min && count <= max) return 1;
  const edge = count < min ? min : max;
  return Math.max(0, 1 - 2 * Math.abs(Math.log10(count / edge)));
}

// `fit` is the model's 0 to 100 judgment of how well the creator's content
// matches the brief, scaled down when their size is outside the brand's
// range. Performance, reliability and the fraud penalty are code.
export function overallScore(fit: number, metrics: Metrics, sizeFit: number): number {
  // A third of followers seeing a typical post and 8% engagement both max out.
  const reach = Math.min(metrics.viewsPerFollower / 0.3, 1);
  const engaged = Math.min(metrics.engagementRate / 0.08, 1);
  const performance = 100 * (0.5 * reach + 0.5 * engaged);
  // Three posts a week is enough.
  const cadence = Math.min(metrics.postsPerWeek / 3, 1);
  const reliability = 100 * (0.5 * metrics.consistency + 0.5 * cadence);

  const base =
    WEIGHTS.fit * clamp(fit) * sizeFit +
    WEIGHTS.performance * performance +
    WEIGHTS.reliability * reliability;
  return Math.round(clamp(base * (1 - FRAUD_PENALTY * metrics.fraudRisk)));
}

// The hard checks come first, so the model cannot talk a creator past them.
export function verdictFor(
  score: number,
  fit: number,
  metrics: Metrics,
  creator: FetchedCreator,
  brand: Brand,
): Verdict {
  if (metrics.postCount === 0 || metrics.fraudRisk >= REJECT_FRAUD_RISK) return "reject";
  if (followerFit(creator.followers, brand) === 0) return "reject";
  if (fit < MIN_FIT) return "reject";
  if (score >= SHORTLIST_SCORE && metrics.postsPerWeek >= MIN_POSTS_PER_WEEK) return "shortlist";
  return score >= MAYBE_SCORE ? "maybe" : "reject";
}

// What one typical post would earn. The median keeps one viral hit from
// inflating the estimate.
export function estimatedPayout(metrics: Metrics, brand: Brand): number {
  if (metrics.medianViews < brand.minimumViews) return 0;
  const earned = (metrics.medianViews / 1000) * brand.ratePerThousandViews;
  return Math.round(Math.min(earned, brand.payoutCapPerPost) * 100) / 100;
}
