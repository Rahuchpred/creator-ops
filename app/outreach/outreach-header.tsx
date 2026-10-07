"use client";

import { AgentRunPanel, MissingKeys, Spinner, useAgentRun } from "@/components/agent-run";
import { Button, PageHeader } from "@/components/ui";

export function OutreachHeader({ missingKeys }: { missingKeys: string[] }) {
  const { run, start, running } = useAgentRun("/api/agents/sales");

  return (
    <>
      <PageHeader
        title="Outreach"
        description="First messages to the suggested creators on the roster. Every draft waits here for your approval, and nothing is sent to a creator yet."
      >
        <Button variant="primary" onClick={start} disabled={running || missingKeys.length > 0}>
          {running ? <Spinner /> : null}
          {running ? "Drafting…" : "Draft outreach"}
        </Button>
      </PageHeader>
      <MissingKeys agent="Sales" keys={missingKeys} />
      <AgentRunPanel run={run} agent="Sales" doneTitle="Drafts ready for approval" />
    </>
  );
}
