"use client";

import { AgentRunPanel, MissingKeys, Spinner, useAgentRun } from "@/components/agent-run";
import { Badge, Button, PageHeader } from "@/components/ui";

export function RosterHeader({ sample, missingKeys }: { sample: boolean; missingKeys: string[] }) {
  const { run, start, running } = useAgentRun("/api/agents/research");

  return (
    <>
      <PageHeader
        title="Roster"
        description="Creators matched to the brief. The score combines how well their content fits with their real reach, posting pace and fraud signals."
      >
        {sample ? <Badge>Sample data</Badge> : null}
        <Button variant="primary" onClick={start} disabled={running || missingKeys.length > 0}>
          {running ? <Spinner /> : null}
          {running ? "Searching…" : "Find creators"}
        </Button>
      </PageHeader>
      <MissingKeys agent="Research" keys={missingKeys} />
      <AgentRunPanel run={run} agent="Research" doneTitle="Roster updated" />
    </>
  );
}
