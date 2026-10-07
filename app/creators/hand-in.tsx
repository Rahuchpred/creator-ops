"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AgentRunPanel, Spinner, useAgentRun } from "@/components/agent-run";
import { Button, buttonClass } from "@/components/ui";
import type { CreatorVideo } from "@/lib/creators";
import { VideoCard } from "./video-card";

// The finished run carries the one video that was checked. Anything else
// (an older server, a dropped field) falls back to the handle lookup.
const isVideo = (value: unknown): value is CreatorVideo =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as CreatorVideo).id === "string" &&
  typeof (value as CreatorVideo).handle === "string" &&
  typeof (value as CreatorVideo).status === "string" &&
  typeof (value as CreatorVideo).views === "number" &&
  typeof (value as CreatorVideo).earned === "number";

export function HandIn({
  brand,
  minimumViews,
  ready,
}: {
  brand: string;
  minimumViews: number;
  // False while the program has no brief to check a video against.
  ready: boolean;
}) {
  const check = useAgentRun("/api/creators/submit");
  const [link, setLink] = useState("");
  const video = check.run.state === "done" && isVideo(check.run.result) ? check.run.result : null;

  return (
    <div className="flex flex-col gap-4">
      <form
        className="card flex flex-col gap-3 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (link.trim() && ready && !check.running) void check.startWith({ link });
        }}
      >
        <label htmlFor="video-link" className="text-sm font-medium">
          Link to your TikTok video
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="video-link"
            name="link"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            required
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://www.tiktok.com/@name/video/123…"
            aria-describedby="video-link-help"
            className="h-11 min-w-0 flex-[1_1_16rem] rounded-full bg-surface px-4 text-sm text-ink shadow-[0_0_0_1px_var(--color-fill-strong)] placeholder:text-faint hover:shadow-[0_0_0_1px_#d6d6db]"
          />
          <Button
            type="submit"
            variant="primary"
            className="h-11 px-5 max-sm:w-full"
            disabled={check.running || !ready}
          >
            {check.running ? <Spinner /> : null}
            {check.running ? "Checking…" : "Check My Video"}
          </Button>
        </div>
        <p id="video-link-help" className="text-[13px] text-pretty text-faint">
          {ready
            ? "Post the video first, then paste its link. It is checked against the brief and for the paid partnership label. About a minute."
            : `${brand} has not written the brief yet, so videos cannot be checked. Come back soon.`}
        </p>
      </form>

      <AgentRunPanel run={check.run} agent="Review" doneTitle="Video checked" />

      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {video ? (
          <>
            <h3 className="text-xs font-medium text-faint">
              Result for your video, <span translate="no">@{video.handle}</span>
            </h3>
            <VideoCard video={video} brand={brand} minimumViews={minimumViews} />
            <Link
              href={`/creators?handle=${encodeURIComponent(video.handle)}#videos`}
              className={`${buttonClass()} self-start`}
            >
              See All Your Videos
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </>
        ) : check.run.state === "done" ? (
          <p className="text-sm text-muted">
            Your video is saved. Look it up with your handle below.
          </p>
        ) : null}
      </div>
    </div>
  );
}
