// TikTok data through Glasser. One paid call returns one page of results, so
// every call here goes through a shared budget.

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";
import { pickImage } from "@/lib/media";
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
  aweme_id?: string;
  video?: { cover?: { url_list?: string[] }; duration?: number };
  url?: string;
  desc?: string;
  is_ad?: boolean;
  is_paid_partnership?: boolean;
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
  user?: {
    uniqueId?: string;
    nickname?: string;
    signature?: string;
    language?: string;
    avatarMedium?: string;
    avatarThumb?: string;
  };
  stats?: { followerCount?: number; followingCount?: number };
};

const toPost = (video: Video): FetchedPost => ({
  id: video.aweme_id,
  url: video.url,
  coverLink: pickImage(video.video?.cover?.url_list),
  // TikTok reports length in milliseconds.
  durationSeconds: video.video?.duration ? Math.round(video.video.duration / 1000) : undefined,
  // Kept long, because a disclosure tag often sits at the end of a caption.
  caption: (video.desc ?? "").slice(0, 1000),
  views: video.statistics?.play_count ?? 0,
  likes: video.statistics?.digg_count ?? 0,
  comments: video.statistics?.comment_count ?? 0,
  shares: video.statistics?.share_count ?? 0,
  createdAt: video.create_time_utc ?? "",
  // TikTok's own paid partnership label. The looser `is_ad` field is true
  // for posts that carry no label at all, so it does not count as disclosure.
  isAd: Boolean(video.is_paid_partnership),
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
    avatarLink: profile.user?.avatarMedium ?? profile.user?.avatarThumb,
    posts: (videos.aweme_list ?? []).map(toPost),
  };
}

// Turns TikTok's timed caption file into short lines like "0:03 text".
function readableTranscript(vtt: string): string {
  const lines: string[] = [];
  let at = "";
  for (const raw of vtt.split("\n")) {
    const line = raw.trim();
    const time = /^(\d+):(\d+):(\d+)\.\d+ -->/.exec(line);
    if (time) {
      const seconds = Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]);
      at = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    } else if (line && line !== "WEBVTT" && at) {
      lines.push(`${at} ${line}`);
      at = "";
    }
  }
  return lines.join("\n");
}

// What is said in one video: one paid call. Comes back empty when the
// video has no speech or the transcript cannot be read, which never fails
// a review.
export async function fetchTranscript(url: string, budget: Budget): Promise<string> {
  try {
    const output = await glasser<{ transcript?: string }>(
      "/v1/tiktok/video/transcript",
      { url },
      budget,
    );
    return readableTranscript(output.transcript ?? "").slice(0, 4000);
  } catch {
    return "";
  }
}

// The videos posted under a hashtag, with their numbers: one paid call.
export async function fetchHashtagPosts(
  hashtag: string,
  budget: Budget,
): Promise<{ handle: string; name: string; videoId: string; post: FetchedPost }[]> {
  const output = await glasser<{ aweme_list?: Video[]; search_item_list?: Video[] }>(
    "/v1/tiktok/search/hashtag",
    { hashtag: hashtag.replace(/^#/, ""), trim: true },
    budget,
  );
  return (output.aweme_list ?? output.search_item_list ?? []).flatMap((video) => {
    const handle = video.author?.unique_id?.toLowerCase();
    return handle && video.aweme_id
      ? [
          {
            handle,
            name: video.author?.nickname ?? handle,
            videoId: video.aweme_id,
            post: toPost(video),
          },
        ]
      : [];
  });
}

// One video by its link: one paid call. Used for a video too old to be in
// the creator's recent posts. Nothing when it cannot be found.
export async function fetchVideo(url: string, budget: Budget): Promise<FetchedPost | null> {
  try {
    const output = await glasser<{ aweme_detail?: Video }>("/v2/tiktok/video", { url, trim: true }, budget);
    return output.aweme_detail?.aweme_id ? toPost(output.aweme_detail) : null;
  } catch {
    return null;
  }
}
