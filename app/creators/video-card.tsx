import { ArrowUpRight, Check, Clock } from "lucide-react";
import { Cover } from "@/components/media";
import { Badge } from "@/components/ui";
import type { CreatorVideo } from "@/lib/creators";
import { formatDay, formatMoney, formatNumber } from "@/lib/format";

const statusTone = {
  Approved: "good",
  "In review": "warn",
  Rejected: "bad",
} as const satisfies Record<CreatorVideo["status"], string>;

// What the status means for the creator, in one plain sentence.
function meaning(video: CreatorVideo, brand: string, minimumViews: number) {
  if (video.status === "In review") {
    return `A person at ${brand} is taking a look. It earns nothing until they decide.`;
  }
  if (video.status === "Rejected") {
    return video.missingLabel
      ? "Not paid. It is missing the paid partnership label or #ad."
      : "Not paid. The note below says what to change next time.";
  }
  return video.earned > 0
    ? "It follows the brief and earns per view."
    : `It follows the brief. It starts earning at ${formatNumber(minimumViews)} views.`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="text-base font-medium tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}

// One handed-in video as its creator sees it.
export function VideoCard({
  video,
  brand,
  minimumViews,
}: {
  video: CreatorVideo;
  brand: string;
  minimumViews: number;
}) {
  return (
    <article className="card grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 p-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:p-5">
      <Cover
        src={video.cover}
        alt=""
        className="aspect-[3/4] w-full self-start rounded-[14px]"
      />

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <Badge tone={statusTone[video.status]}>{video.status}</Badge>
          {video.postedAt ? (
            <span className="text-xs text-faint">Posted {formatDay(video.postedAt)}</span>
          ) : null}
        </div>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-medium break-words">
          {video.caption || "No caption"}
        </h3>
        <p className="text-sm text-pretty text-muted">
          {meaning(video, brand, minimumViews)}
        </p>
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <Stat label="Views" value={formatNumber(video.views)} />
          <Stat label="Earned so far" value={formatMoney(video.earned)} />
        </dl>
      </div>

      {video.feedback ? (
        <div className="col-span-2 rounded-[14px] bg-fill px-4 py-3">
          <h4 className="text-xs font-medium text-faint">Note from the reviewer</h4>
          <p className="mt-1 text-sm leading-relaxed break-words text-pretty">{video.feedback}</p>
        </div>
      ) : null}

      <div className="col-span-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px]">
        {video.earned > 0 ? (
          video.payoutApproved ? (
            <span className="flex items-center gap-1.5 text-good">
              <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.5} />
              Payout approved by {brand}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted">
              <Clock aria-hidden="true" className="size-4 shrink-0" />
              Waiting for {brand} to approve the payout
            </span>
          )
        ) : (
          <span className="text-faint">No payout to approve yet</span>
        )}
        {video.url ? (
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full font-medium underline decoration-fill-strong decoration-2 underline-offset-4 hover:decoration-ink"
          >
            Open on TikTok
            <ArrowUpRight aria-hidden="true" className="size-3.5 text-faint" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
