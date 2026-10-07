"use client";

import { AgentRunPanel, MissingKeys, Spinner, useAgentRun } from "@/components/agent-run";
import { Badge, Button, PageHeader } from "@/components/ui";

export function BriefHeader({
  updated,
  writtenBy,
  missingKeys,
}: {
  // Left out when no brief has been written yet.
  updated?: string;
  writtenBy?: string;
  missingKeys: string[];
}) {
  const { run, start, running } = useAgentRun("/api/agents/strategy");

  return (
    <>
      <PageHeader
        title="Brief"
        description="What creators are asked to make. Every post is scored against this page."
      >
        {writtenBy ? (
          <Badge>
            {writtenBy}, {updated}
          </Badge>
        ) : null}
        <Button variant="primary" onClick={start} disabled={running || missingKeys.length > 0}>
          {running ? <Spinner /> : null}
          {running ? "Writing…" : writtenBy ? "Write a new brief" : "Write the brief"}
        </Button>
      </PageHeader>
      <MissingKeys agent="Strategy" keys={missingKeys} />
      <AgentRunPanel run={run} agent="Strategy" doneTitle="New brief ready" />
    </>
  );
}
