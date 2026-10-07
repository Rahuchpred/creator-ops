"use client";

import { AgentRunPanel, MissingKeys, Spinner, useAgentRun } from "@/components/agent-run";
import { Badge, Button, PageHeader } from "@/components/ui";

export function PostsHeader({ sample, missingKeys }: { sample: boolean; missingKeys: string[] }) {
  const { run, start, running } = useAgentRun("/api/agents/review");

  return (
    <>
      <PageHeader
        title="Posts"
        description="Every video creators have posted, scored against the brief. Flagged posts wait for a person."
      >
        {sample ? <Badge>Sample data</Badge> : null}
        <Button variant="primary" onClick={start} disabled={running || missingKeys.length > 0}>
          {running ? <Spinner /> : null}
          {running ? "Reviewing…" : "Review posts"}
        </Button>
      </PageHeader>
      <MissingKeys agent="Review" keys={missingKeys} />
      <AgentRunPanel run={run} agent="Review" doneTitle="Posts reviewed" />
    </>
  );
}
