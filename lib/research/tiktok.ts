// TikTok data through Glasser. One paid call returns one page of results, so
// every call here goes through a shared budget.

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";
import type { FetchedCreator, FetchedPost } from "./metrics";

const run = promisify(execFile);

export type Budget = { callsLeft: number };

export type FoundVideo = {
  handle: string;
  name: string;
  caption: string;
  views: number;
  likes: number;
  isAd: boolean;
  language: string;
  region: string;
};

type Stats = {
  play_count?: number;
  digg_count?: number;
  comment_count?: number;
  share_count?: number;
};

type Video = {
  desc?: string;
  is_ad?: boolean;
  region?: string;
  desc_language?: string;
  create_time_utc?: string;
  statistics?: Stats;
  author?: { unique_id?: string; nickname?: string };
};

async function glasser<T>(endpoint: string, input: object, budget: Budget): Promise<T> {
  if (budget.callsLeft <= 0) {
    throw new Error("The data budget for this run is used up.");
  }
  budget.callsLeft -= 1;

  const bin = path.join(process.cwd(), "node_modules", ".bin", "glasser");
  const { stdout } = await run(
    bin,
    [
      "--json", "run", "-p", "scrapecreators", "-e", endpoint,
      "-i", JSON.stringify(input),
      "--wait", "--wait-timeout", "75",
      // Glasser requires one per paid call, so a retry is never billed twice.
      "--idempotency-key", randomUUID(),
    ],
    { timeout: 90_000, maxBuffer: 32 * 1024 * 1024 },
  );

  const result = JSON.parse(stdout) as { status?: string; output?: T; failure?: unknown };
  if (result.status !== "COMPLETED" || !result.output) {
    throw new Error(`TikTok data came back ${result.status ?? "empty"}.`);
  }
  return result.output;
}

export async function searchVideos(
  query: string,
  kind: "keyword" | "hashtag",
  budget: Budget,
): Promise<FoundVideo[]> {
  const output =
    kind === "hashtag"
      ? await glasser<{ aweme_list?: Video[]; search_item_list?: Video[] }>(
          "/v1/tiktok/search/hashtag",
          { hashtag: query.replace(/^#/, ""), trim: true },
          budget,
        )
      : await glasser<{ aweme_list?: Video[]; search_item_list?: Video[] }>(
          "/v1/tiktok/search/keyword",
          { query, trim: true },
          budget,
        );

  return (output.search_item_list ?? output.aweme_list ?? []).flatMap((video) => {
    const handle = video.author?.unique_id;
    if (!handle) return [];
    return [
      {
        handle,
        name: video.author?.nickname ?? handle,
        caption: (video.desc ?? "").slice(0, 160),
        views: video.statistics?.play_count ?? 0,
        likes: video.statistics?.digg_count ?? 0,
        isAd: Boolean(video.is_ad),
        language: video.desc_language ?? "",
        region: video.region ?? "",
      },
    ];
  });
}

type Profile = {
  user?: { uniqueId?: string; nickname?: string; signature?: string; language?: string };
  stats?: { followerCount?: number; followingCount?: number };
};

const toPost = (video: Video): FetchedPost => ({
  caption: (video.desc ?? "").slice(0, 200),
  views: video.statistics?.play_count ?? 0,
  likes: video.statistics?.digg_count ?? 0,
  comments: video.statistics?.comment_count ?? 0,
  shares: video.statistics?.share_count ?? 0,
  createdAt: video.create_time_utc ?? "",
  isAd: Boolean(video.is_ad),
});

// A creator's profile and their recent posts: two paid calls.
export async function fetchCreator(handle: string, budget: Budget): Promise<FetchedCreator> {
  const [profile, videos] = await Promise.all([
    glasser<Profile>("/v1/tiktok/profile", { handle }, budget),
    glasser<{ aweme_list?: Video[] }>("/v3/tiktok/profile/videos", { handle, trim: true }, budget),
  ]);

  return {
    handle,
    name: profile.user?.nickname ?? handle,
    bio: profile.user?.signature ?? "",
    language: profile.user?.language ?? "",
    followers: profile.stats?.followerCount ?? 0,
    following: profile.stats?.followingCount ?? 0,
    posts: (videos.aweme_list ?? []).map(toPost),
  };
}
