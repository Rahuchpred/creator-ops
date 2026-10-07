// Drafts outreach for two made-up creators against the sample brand and brief
// and prints what comes back. Nothing is sent. For debugging:
// bun --env-file=.env.local scripts/sales-check.ts
import { draftOutreach, type Prospect } from "@/lib/agents/sales";
import { brand, brief } from "@/lib/data";

const prospects: Prospect[] = [
  {
    handle: "rhea.revises",
    name: "Rhea N.",
    platform: "TikTok",
    niche: "Exam prep",
    followers: 27400,
    averageViews: 19600,
    note: "Posts timed revision sessions from her dorm desk, usually late at night.",
  },
  {
    handle: "desk.by.omar",
    name: "Omar F.",
    platform: "Instagram",
    niche: "Desk setups",
    followers: 13800,
    averageViews: 8200,
  },
];

const started = Date.now();
const drafts = await draftOutreach(brand, brief, prospects, (label) => console.log("step", label));
console.log(`drafted in ${Math.round((Date.now() - started) / 1000)}s\n`);

for (const draft of drafts) {
  console.log(`@${draft.handle}`);
  console.log(`Subject: ${draft.subject}`);
  console.log(`Why: ${draft.why}`);
  console.log(`\n${draft.message}\n`);
  console.log(`(${draft.message.split(/\s+/).length} words)\n`);
}
