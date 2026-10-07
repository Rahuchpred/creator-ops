"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowUpRight, Eye, Heart, Target } from "lucide-react";
import { Spinner } from "@/components/agent-run";
import {
  DetailDialog,
  Fact,
  backdropClass,
  popupMotionClass,
} from "@/components/detail-dialog";
import { Avatar, Cover } from "@/components/media";
import { TrustBadge, TrustReasons } from "@/components/trust";
import { Badge, Button, Chip, Handle, buttonClass, cardButtonClass } from "@/components/ui";
import { payoutForPost, type Post } from "@/lib/data";
import { cx, formatCompact, formatDay, formatMoney, formatNumber } from "@/lib/format";
import { duplicateOf } from "@/lib/review/checks";
import { flagsOf, handleKey, trustFor } from "@/lib/review/trust";

const statusTone = {
  Approved: "good",
  "In review": "brand",
  Rejected: "bad",
} as const satisfies Record<Post["status"], string>;

function earns(post: Post) {
  if (post.status === "Rejected") return "Nothing";
  if (post.status === "In review") return "None yet";
  return formatMoney(post.payout ?? payoutForPost(post));
}

const rate = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const percent = (value: number) => rate.format(value);

function length(seconds: number) {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// The same three numbers on a card and in its detail view.
function Metrics({ post }: { post: Post }) {
  return (
    <>
      <Chip color="violet" label="Views" icon={Eye}>
        {formatCompact(post.views)}
      </Chip>
      {post.engagementRate !== undefined ? (
        <Chip color="green" label="Engagement" icon={Heart}>
          {percent(post.engagementRate)}
        </Chip>
      ) : null}
      <Chip color="orange" label="Brief score" icon={Target}>
        {post.briefScore}
      </Chip>
    </>
  );
}

export function PostsGrid({
  posts,
  banned,
  canBan,
}: {
  posts: Post[];
  // Handles a person banned, lowercase.
  banned: string[];
  // False for the sample rows, which belong to no saved creator.
  canBan: boolean;
}) {
  // The chosen post stays set while the dialog animates out, so its content
  // does not blank mid-close.
  const [chosen, setChosen] = useState<Post | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [deciding, setDeciding] = useState(false);
  const [problem, setProblem] = useState("");

  // A person's final call on a held post. The saved post comes back with
  // its payout worked out.
  const decide = async (post: Post, status: "Approved" | "Rejected") => {
    setDeciding(true);
    setProblem("");
    try {
      const response = await fetch("/api/posts/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, status }),
      });
      const body = (await response.json()) as Post & { message?: string };
      if (!response.ok) throw new Error(body.message ?? "The decision was not saved. Try again.");
      setChosen(body);
      router.refresh();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "The decision was not saved. Try again.");
    } finally {
      setDeciding(false);
    }
  };

  // A ban or unban made a moment ago, shown before the page data catches up.
  const [changed, setChanged] = useState<Record<string, boolean>>({});
  const isBanned = (handle: string) => changed[handleKey(handle)] ?? banned.includes(handleKey(handle));
  const [asking, setAsking] = useState(false);
  const [banning, setBanning] = useState(false);
  const [banProblem, setBanProblem] = useState("");
  const [notice, setNotice] = useState("");

  // Bans the creator, or lifts the ban. A ban rejects their saved posts, and
  // those come back so the open post shows its new status.
  const setBan = async (post: Post, ban: boolean) => {
    setBanning(true);
    setBanProblem("");
    try {
      const response = await fetch("/api/creators/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: post.handle, banned: ban }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
        posts?: Post[];
      } | null;
      if (!response.ok || !body) {
        throw new Error(body?.message ?? "The change was not saved. Try again.");
      }
      setChanged((current) => ({ ...current, [handleKey(post.handle)]: ban }));
      const fresh = body.posts?.find((row) => row.id === post.id);
      if (fresh) setChosen(fresh);
      const count = body.posts?.length ?? 0;
      setNotice(
        ban
          ? `@${post.handle} is banned. ${count === 1 ? "Their 1 post is" : `Their ${count} posts are`} rejected and earn nothing.`
          : `@${post.handle} can hand in posts again. Nothing else changed.`,
      );
      setAsking(false);
      router.refresh();
    } catch (error) {
      setBanProblem(error instanceof Error ? error.message : "The change was not saved. Try again.");
    } finally {
      setBanning(false);
    }
  };

  const chosenBanned = chosen ? isBanned(chosen.handle) : false;
  // The score counts program posts only, so a test row has none.
  const theirs = chosen
    ? posts.filter((post) => post.submitted && handleKey(post.handle) === handleKey(chosen.handle))
    : [];
  const trust = theirs.length > 0 ? trustFor(theirs, chosenBanned) : null;
  const copied =
    chosen && flagsOf(chosen).includes("Duplicate") ? duplicateOf(chosen, posts) : undefined;

  if (posts.length === 0) {
    return (
      <p className="card p-10 text-center text-sm text-muted">
        No posts yet. Paste a creator&apos;s video link above to review the first one.
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
        {posts.map((post) => {
          const flags = flagsOf(post);
          return (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => {
                  setChosen(post);
                  setProblem("");
                  setNotice("");
                  setOpen(true);
                }}
                className={cx(cardButtonClass, "flex h-full flex-col p-2 text-sm")}
              >
                <span className="relative block">
                  <Cover src={post.cover} alt="" className="aspect-[3/4] w-full rounded-[14px]" />
                  <span className="absolute top-2 left-2 flex flex-wrap gap-1 pr-2">
                    <Badge tone={statusTone[post.status]}>{post.status}</Badge>
                    {isBanned(post.handle) ? <Badge tone="bad">Banned</Badge> : null}
                  </span>
                  {post.durationSeconds ? (
                    <span className="absolute right-2 bottom-2 rounded-full bg-ink/70 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
                      <span className="sr-only">Length </span>
                      {length(post.durationSeconds)}
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-1 flex-col px-1.5 pt-3 pb-1.5">
                  <span className="block truncate font-medium">{post.caption || "No caption"}</span>
                  <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-faint">
                    <Avatar handle={post.handle} src={post.avatar} size="sm" />
                    <span translate="no" className="truncate">
                      @{post.handle}
                    </span>
                    {post.postedAt ? (
                      <span className="shrink-0">· {formatDay(post.postedAt)}</span>
                    ) : null}
                  </span>
                  <span className="mt-2.5 flex flex-wrap gap-1">
                    <Metrics post={post} />
                  </span>
                  {flags.length > 0 ? (
                    <span className="mt-2 flex items-center gap-1.5 text-xs text-warn">
                      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warn" />
                      <span className="truncate">
                        {flags[0]}
                        {flags.length > 1 ? ` and ${flags.length - 1} more` : ""}
                      </span>
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <DetailDialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title={chosen ? `Post by @${chosen.handle}` : "Post"}
      >
        {chosen ? (
          <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-5 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-x-7">
            <Cover
              src={chosen.cover}
              alt={`Cover of the video by @${chosen.handle}`}
              className="aspect-[9/16] w-full self-start rounded-[16px] md:row-span-2"
            />

            <div className="flex min-w-0 flex-col gap-3 pr-8 md:pr-10">
              <Handle
                handle={chosen.handle}
                name={[chosen.name ?? chosen.platform, chosen.postedAt && formatDay(chosen.postedAt)]
                  .filter(Boolean)
                  .join(" · ")}
                avatar={chosen.avatar}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={statusTone[chosen.status]}>{chosen.status}</Badge>
                {chosenBanned ? <Badge tone="bad">Banned</Badge> : null}
                {chosen.decidedBy ? <Badge>Your call</Badge> : null}
                {trust && !chosenBanned ? <TrustBadge trust={trust} /> : null}
                {flagsOf(chosen).map((flag) => (
                  <Badge key={flag} tone="warn">
                    {flag}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                <Metrics post={chosen} />
              </div>
            </div>

            <div className="col-span-2 flex min-w-0 flex-col gap-5 md:col-span-1 md:col-start-2">
              <div>
                <h3 className="text-xs font-medium text-faint">Caption</h3>
                <p className="mt-1 text-sm leading-relaxed break-words text-pretty">
                  {chosen.caption || "No caption"}
                </p>
              </div>
              {chosen.transcript ? (
                <div>
                  <h3 className="text-xs font-medium text-faint">What is said in the video</h3>
                  <p className="mt-1 max-h-40 overflow-y-auto rounded-[14px] bg-fill px-3.5 py-3 text-[13px] leading-relaxed whitespace-pre-line break-words tabular-nums">
                    {chosen.transcript}
                  </p>
                </div>
              ) : null}
              {chosen.feedback ? (
                <div>
                  <h3 className="text-xs font-medium text-faint">What the reviewer said</h3>
                  <p className="mt-1 text-sm leading-relaxed break-words text-pretty">
                    {chosen.feedback}
                  </p>
                </div>
              ) : null}
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Fact label="Earns" value={earns(chosen)} />
                <Fact label="Views" value={formatNumber(chosen.views)} />
                <Fact label="Brief score" value={chosen.briefScore} />
                {chosen.likes !== undefined ? (
                  <Fact label="Likes" value={formatNumber(chosen.likes)} />
                ) : null}
                {chosen.comments !== undefined ? (
                  <Fact label="Comments" value={formatNumber(chosen.comments)} />
                ) : null}
                {chosen.durationSeconds ? (
                  <Fact label="Length" value={length(chosen.durationSeconds)} />
                ) : null}
              </dl>
              {copied ? (
                <p className="rounded-[14px] bg-warn-soft px-4 py-3 text-sm text-pretty text-warn">
                  This matches a post <span translate="no">@{copied.handle}</span> already handed
                  in: the same {copied.id === chosen.id ? "video" : "caption and length"}. It is
                  held until you decide whose it is.
                </p>
              ) : null}
              {chosen.feedback !== undefined ? (
                <div className="flex flex-col gap-2 rounded-[16px] bg-fill p-4">
                  <p className="text-sm text-pretty">
                    {chosenBanned
                      ? "This creator is banned, so their posts cannot be approved."
                      : chosen.status === "In review"
                        ? "This post is held for you. Approve it to pay it, or reject it."
                        : "The final call is yours. Watch the video, then change it if you disagree."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chosen.status !== "Approved" && !chosenBanned ? (
                      <Button
                        variant={chosen.status === "In review" ? "primary" : "secondary"}
                        size="sm"
                        disabled={deciding}
                        onClick={() => decide(chosen, "Approved")}
                      >
                        Approve Post
                      </Button>
                    ) : null}
                    {chosen.status !== "Rejected" ? (
                      <Button size="sm" disabled={deciding} onClick={() => decide(chosen, "Rejected")}>
                        Reject Post
                      </Button>
                    ) : null}
                  </div>
                  {problem ? (
                    <p role="alert" className="text-[13px] text-bad">
                      {problem}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {canBan ? (
                <section
                  aria-labelledby="creator-trust"
                  className="flex flex-col gap-3 rounded-[16px] p-4 shadow-[0_0_0_1px_var(--color-line)]"
                >
                  <h3 id="creator-trust" className="text-sm font-semibold tracking-tight">
                    Creator trust{trust ? `: ${trust.score} of 100` : ""}
                  </h3>
                  {trust ? (
                    <TrustReasons trust={trust} />
                  ) : (
                    <p className="text-[13px] text-pretty text-muted">
                      No score yet. It is worked out from program posts, and this is a test row.
                    </p>
                  )}
                  <p role="status" aria-live="polite" className="text-[13px] text-pretty empty:hidden">
                    {notice}
                  </p>
                  <Dialog.Root
                    open={asking}
                    onOpenChange={(next) => {
                      setAsking(next);
                      setBanProblem("");
                    }}
                  >
                    <Dialog.Trigger
                      className={cx(
                        buttonClass({ size: "sm" }),
                        "self-start",
                        !chosenBanned && "!text-bad",
                      )}
                    >
                      {chosenBanned ? "Unban Creator" : "Ban Creator"}
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Backdrop className={backdropClass} />
                      <Dialog.Popup
                        className={cx(
                          "fixed top-1/2 left-1/2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overscroll-contain rounded-[24px] bg-surface p-6 shadow-[0_0_0_1px_var(--color-line),0_24px_60px_-20px_rgb(16_17_20/0.3)]",
                          popupMotionClass,
                        )}
                      >
                        <Dialog.Title className="text-xl font-medium tracking-[-0.02em]">
                          {chosenBanned ? "Unban" : "Ban"}{" "}
                          <span translate="no">@{chosen.handle}</span>?
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm text-pretty text-muted">
                          {chosenBanned
                            ? "This only lets them hand in posts again. Nothing is restored: their posts stay rejected until you approve each one yourself."
                            : "Every post they have in the program becomes Rejected and earns nothing, and new posts from them are refused. Lifting the ban later does not bring those posts back."}
                        </Dialog.Description>
                        {banProblem ? (
                          <p
                            role="alert"
                            className="mt-4 rounded-[14px] bg-bad-soft px-4 py-3 text-sm text-bad"
                          >
                            {banProblem}
                          </p>
                        ) : null}
                        <div className="mt-6 flex justify-end gap-2">
                          <Dialog.Close className={buttonClass()}>Cancel</Dialog.Close>
                          <Button
                            variant={chosenBanned ? "primary" : "secondary"}
                            className={chosenBanned ? undefined : "!text-bad"}
                            disabled={banning}
                            onClick={() => setBan(chosen, !chosenBanned)}
                          >
                            {banning ? <Spinner /> : null}
                            {banning ? "Saving…" : chosenBanned ? "Unban Creator" : "Ban Creator"}
                          </Button>
                        </div>
                      </Dialog.Popup>
                    </Dialog.Portal>
                  </Dialog.Root>
                </section>
              ) : null}
              {chosen.url ? (
                <a
                  href={chosen.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cx(
                    buttonClass({ variant: chosen.status === "In review" ? "secondary" : "primary" }),
                    "self-start",
                  )}
                >
                  Watch on {chosen.platform}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </DetailDialog>
    </>
  );
}
