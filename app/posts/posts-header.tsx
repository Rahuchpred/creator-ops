"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { AgentRunPanel, MissingKeys, Spinner, useAgentRun } from "@/components/agent-run";
import { Badge, Button, PageHeader, Tile } from "@/components/ui";

export function PostsHeader({
  sample,
  submitted,
  missingKeys,
}: {
  sample: boolean;
  // How many posts have been handed in by link.
  submitted: number;
  missingKeys: string[];
}) {
  const all = useAgentRun("/api/agents/review");
  const one = useAgentRun("/api/posts/submit");
  const [link, setLink] = useState("");
  const busy = all.running || one.running;
  const blocked = busy || missingKeys.length > 0;

  return (
    <>
      <PageHeader
        title="Posts"
        description="Videos creators posted for the program, scored against the brief. Held posts wait for your call."
      >
        {sample ? <Badge>Sample data</Badge> : null}
        <Button variant={submitted > 0 ? "primary" : "secondary"} onClick={all.start} disabled={blocked}>
          {all.running ? <Spinner /> : null}
          {all.running ? "Reviewing…" : submitted > 0 ? "Refresh Reviews" : "Run a Test Review"}
        </Button>
      </PageHeader>
      <MissingKeys agent="Marketing" keys={missingKeys} />

      <form
        className="card flex flex-wrap items-end gap-3 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (link.trim()) void one.startWith({ link });
        }}
      >
        <Tile color="blue" size="sm">
          <Link2 aria-hidden="true" className="size-4" />
        </Tile>
        <div className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
          <label htmlFor="post-link" className="text-sm font-medium">
            Add a posted video
          </label>
          <input
            id="post-link"
            name="link"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://www.tiktok.com/@name/video/123…"
            className="w-full rounded-[14px] bg-surface px-3.5 py-2.5 text-sm text-ink shadow-[0_0_0_1px_var(--color-fill-strong)] placeholder:text-faint hover:shadow-[0_0_0_1px_#d6d6db]"
          />
        </div>
        <Button type="submit" variant="primary" disabled={blocked || !link.trim()}>
          {one.running ? <Spinner /> : null}
          {one.running ? "Reviewing…" : "Review This Post"}
        </Button>
        <p className="basis-full text-[13px] text-pretty text-faint">
          Paste the TikTok link a creator sends you. The Marketing agent checks it against the brief,
          looks for the paid label and odd views, and works out what it earns. About a minute.
        </p>
      </form>

      <AgentRunPanel run={one.run} agent="Marketing" doneTitle="Post reviewed" />
      <AgentRunPanel run={all.run} agent="Marketing" doneTitle="Posts reviewed" />
    </>
  );
}
