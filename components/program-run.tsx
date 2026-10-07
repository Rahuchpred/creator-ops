"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Rewind } from "lucide-react";
import { AgentRunPanel, MissingKeys, Spinner, useAgentRun } from "@/components/agent-run";
import { Button, Tile } from "@/components/ui";

// One press runs every agent in order. When a real run has been recorded
// for this program, it can also be played back fast: same steps, same
// results, no waiting.
export function ProgramRun({
  missingKeys,
  recorded,
  hasResults,
}: {
  missingKeys: string[];
  // Whether any screen has results that Start Over would clear.
  hasResults: boolean;
  // How long the recorded run took, in seconds, when there is one.
  recorded?: number;
}) {
  // The screens behind the panel refresh as each agent hands over.
  const { run, start, startWith, running } = useAgentRun("/api/program/run", /agent started$/);
  const [replaying, setReplaying] = useState(false);
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  // Empties the screens, so a run or a replay can be shown from the start.
  const startOver = async () => {
    setClearing(true);
    try {
      await fetch("/api/program/reset", { method: "POST" });
      router.refresh();
    } finally {
      setClearing(false);
    }
  };


  return (
    <>
      <section className="card flex flex-wrap items-center gap-4 p-5" aria-labelledby="run-program">
        <Tile color="blue">
          <Play aria-hidden="true" />
        </Tile>
        <div className="min-w-[14rem] flex-1">
          <h2 id="run-program" className="text-base font-semibold tracking-tight">
            Run the whole program
          </h2>
          <p className="text-sm text-pretty text-muted">
            Strategy writes the brief, Research builds the roster, Sales drafts the outreach, then
            Marketing checks the hashtag. It stops for your approval.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasResults ? (
            <Button variant="quiet" disabled={running || clearing} onClick={startOver}>
              {clearing ? "Clearing…" : "Start Over"}
            </Button>
          ) : null}
          {recorded ? (
            <Button
              disabled={running}
              onClick={() => {
                setReplaying(true);
                void startWith({ replay: true });
              }}
            >
              {running && replaying ? <Spinner /> : <Rewind aria-hidden="true" className="size-4" />}
              Replay Last Run
            </Button>
          ) : null}
          <Button
            variant="primary"
            disabled={running || missingKeys.length > 0}
            onClick={() => {
              setReplaying(false);
              void start();
            }}
          >
            {running && !replaying ? <Spinner /> : null}
            {running && !replaying ? "Running…" : "Run the Program"}
          </Button>
        </div>
      </section>
      <MissingKeys agent="Strategy" keys={missingKeys} />
      <AgentRunPanel run={run} agent="Program" doneTitle="Program ready for your approval" />
    </>
  );
}
