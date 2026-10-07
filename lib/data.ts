// Sample data for stage 1. Everything here is made up so the screens have
// something real-shaped to show. Stage 1 ends by swapping this module for the
// database, and the agents in later stages write to the same shapes.

export type Platform = "TikTok" | "Instagram";

export type Brand = {
  name: string;
  product: string;
  audience: string;
  monthlyBudget: number;
  ratePerThousandViews: number;
  payoutCapPerPost: number;
  minimumViews: number;
  rules: string[];
};

export type Brief = {
  updatedAt: string;
  writtenBy: "Sample" | "Strategy agent";
  goal: string;
  angle: string;
  hooks: string[];
  mustInclude: string[];
  avoid: string[];
  references: { title: string; why: string; url: string }[];
  // Every page the agent read while researching. Empty for the sample brief.
  sources: { title: string; url: string; site: string }[];
};

export type CreatorStatus = "Suggested" | "Contacted" | "Onboarded" | "Declined";

export type Creator = {
  handle: string;
  name: string;
  platform: Platform;
  followers: number;
  averageViews: number;
  fit: number;
  niche: string;
  status: CreatorStatus;
};

export type PostFlag = "View spike" | "No disclosure" | null;
export type PostStatus = "In review" | "Approved" | "Rejected";

export type Post = {
  id: string;
  handle: string;
  platform: Platform;
  caption: string;
  postedAt: string;
  views: number;
  briefScore: number;
  flag: PostFlag;
  status: PostStatus;
};

export type PayoutStatus = "Awaiting approval" | "Approved" | "Paid";

export type Payout = {
  handle: string;
  posts: number;
  views: number;
  amount: number;
  status: PayoutStatus;
};

export const brand: Brand = {
  name: "Lumen",
  product: "A study timer app that locks your phone until the session ends.",
  audience: "University students, 18 to 24, who study from their phone.",
  monthlyBudget: 12000,
  ratePerThousandViews: 1.2,
  payoutCapPerPost: 400,
  minimumViews: 5000,
  rules: [
    "Mark every post as a paid partnership or use #ad.",
    "Show the app on screen in the first three seconds.",
    "Never promise better grades.",
    "No mention of other study apps by name.",
  ],
};

export const brief: Brief = {
  updatedAt: "2026-10-02",
  writtenBy: "Sample",
  goal: "Get students to try one locked study session this week.",
  angle:
    "The phone is the problem and the fix. Show the moment the lock kicks in and the relief that follows.",
  hooks: [
    "I gave my phone to an app for two hours and this is what happened.",
    "The only study method that worked was the one I could not quit.",
    "My screen time during finals was eleven hours a day. Then I tried this.",
  ],
  mustInclude: [
    "The lock screen, shown within three seconds",
    "A real desk, not a staged one",
    "Paid partnership label or #ad",
  ],
  avoid: [
    "Claims about grades or exam results",
    "Naming other study apps",
    "Voiceover with no footage of the app",
  ],
  references: [
    {
      title: "Desk time-lapse with on-screen timer",
      why: "Holds viewers to the end because they wait for the timer to finish.",
      url: "",
    },
    {
      title: "Screen time confession, face to camera",
      why: "Opens on a number people compare with their own.",
      url: "",
    },
  ],
  sources: [],
};

export const creators: Creator[] = [
  { handle: "noor.studies", name: "Noor A.", platform: "TikTok", followers: 48200, averageViews: 31400, fit: 94, niche: "Study vlogs", status: "Onboarded" },
  { handle: "deskbyjun", name: "Jun P.", platform: "Instagram", followers: 22900, averageViews: 18700, fit: 91, niche: "Desk setups", status: "Onboarded" },
  { handle: "theo.revises", name: "Theo M.", platform: "TikTok", followers: 76500, averageViews: 52300, fit: 88, niche: "Exam prep", status: "Onboarded" },
  { handle: "late.library", name: "Imani R.", platform: "TikTok", followers: 15300, averageViews: 24100, fit: 86, niche: "Study vlogs", status: "Onboarded" },
  { handle: "mila.at.midnight", name: "Mila K.", platform: "Instagram", followers: 34100, averageViews: 12800, fit: 83, niche: "Student life", status: "Contacted" },
  { handle: "sana.codes", name: "Sana V.", platform: "TikTok", followers: 61800, averageViews: 27600, fit: 79, niche: "Computer science", status: "Contacted" },
  { handle: "marcoflashcards", name: "Marco D.", platform: "TikTok", followers: 9400, averageViews: 15900, fit: 77, niche: "Med school", status: "Contacted" },
  { handle: "inkandiva", name: "Iva S.", platform: "Instagram", followers: 28700, averageViews: 9600, fit: 74, niche: "Note taking", status: "Suggested" },
  { handle: "pim.studyvlog", name: "Pim W.", platform: "TikTok", followers: 12600, averageViews: 19800, fit: 72, niche: "Study vlogs", status: "Suggested" },
  { handle: "zoe.unfocused", name: "Zoe H.", platform: "TikTok", followers: 53900, averageViews: 41200, fit: 69, niche: "Productivity humor", status: "Suggested" },
  { handle: "harlow.exe", name: "Harlow T.", platform: "Instagram", followers: 18100, averageViews: 7300, fit: 61, niche: "Student life", status: "Suggested" },
  { handle: "kaidoesnotes", name: "Kai L.", platform: "TikTok", followers: 40300, averageViews: 22500, fit: 58, niche: "Note taking", status: "Declined" },
];

export const posts: Post[] = [
  { id: "p-108", handle: "theo.revises", platform: "TikTok", caption: "Two hours, phone locked, one chapter done", postedAt: "2026-10-05", views: 184300, briefScore: 92, flag: null, status: "Approved" },
  { id: "p-107", handle: "noor.studies", platform: "TikTok", caption: "My screen time was eleven hours a day", postedAt: "2026-10-04", views: 96700, briefScore: 88, flag: null, status: "Approved" },
  { id: "p-106", handle: "late.library", platform: "TikTok", caption: "Library closes at midnight, so does my phone", postedAt: "2026-10-04", views: 412900, briefScore: 81, flag: "View spike", status: "In review" },
  { id: "p-105", handle: "deskbyjun", platform: "Instagram", caption: "Desk reset and a locked ninety minutes", postedAt: "2026-10-03", views: 38200, briefScore: 85, flag: null, status: "Approved" },
  { id: "p-104", handle: "noor.studies", platform: "TikTok", caption: "Study with me, timer on screen", postedAt: "2026-10-01", views: 57400, briefScore: 79, flag: null, status: "Approved" },
  { id: "p-103", handle: "deskbyjun", platform: "Instagram", caption: "What is on my desk this term", postedAt: "2026-09-30", views: 21600, briefScore: 54, flag: "No disclosure", status: "Rejected" },
  { id: "p-102", handle: "theo.revises", platform: "TikTok", caption: "The method I could not quit", postedAt: "2026-09-29", views: 73800, briefScore: 90, flag: null, status: "Approved" },
  { id: "p-101", handle: "late.library", platform: "TikTok", caption: "First week with the lock", postedAt: "2026-09-28", views: 12900, briefScore: 76, flag: null, status: "Approved" },
];

export function payoutForPost(post: Post): number {
  if (post.status !== "Approved" || post.views < brand.minimumViews) return 0;
  const earned = (post.views / 1000) * brand.ratePerThousandViews;
  return Math.min(earned, brand.payoutCapPerPost);
}

const paidAlready = new Set(["late.library"]);

export const payouts: Payout[] = creators
  .filter((creator) => creator.status === "Onboarded")
  .map((creator) => {
    const approved = posts.filter(
      (post) => post.handle === creator.handle && post.status === "Approved",
    );
    return {
      handle: creator.handle,
      posts: approved.length,
      views: approved.reduce((sum, post) => sum + post.views, 0),
      amount: approved.reduce((sum, post) => sum + payoutForPost(post), 0),
      status: paidAlready.has(creator.handle) ? "Paid" : "Awaiting approval",
    } satisfies Payout;
  })
  .sort((a, b) => b.amount - a.amount);

export const totals = {
  views: posts
    .filter((post) => post.status === "Approved")
    .reduce((sum, post) => sum + post.views, 0),
  spend: payouts.reduce((sum, payout) => sum + payout.amount, 0),
  onboarded: creators.filter((creator) => creator.status === "Onboarded").length,
  awaitingApproval: payouts.filter((payout) => payout.status === "Awaiting approval").length,
  flaggedPosts: posts.filter((post) => post.flag !== null && post.status === "In review").length,
};
