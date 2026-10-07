// Runs the Research agent once against the saved brief and prints the roster.
// For debugging: bun run research:check
import { findCreators } from "@/lib/agents/research";
import { brand, brief as sampleBrief } from "@/lib/data";
import { readBrief, saveRoster } from "@/lib/files";

const brief = (await readBrief()) ?? sampleBrief;
const roster = await findCreators(brand, brief, (step) => console.log("-", step));
await saveRoster(roster);
for (const row of roster) {
  console.log(
    `${row.status.padEnd(9)} score ${String(row.score).padStart(3)} fit ${String(row.fit).padStart(3)} @${row.handle} | ${row.followers} followers, ${row.averageViews} typical views | flags: ${row.flags?.join(", ") || "none"} | est $${row.estimatedPayout}\n   ${row.reason}`,
  );
}
