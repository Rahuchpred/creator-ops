// Runs the Review agent once against the saved roster and brief and prints
// the reviewed posts. For debugging: bun run review:check
import { reviewPosts } from "@/lib/agents/review";
import { brand, brief as sampleBrief } from "@/lib/data";
import { readBrief, savePosts } from "@/lib/files";

const brief = (await readBrief()) ?? sampleBrief;
const posts = await reviewPosts(brand, brief, (step) => console.log("-", step));
await savePosts(posts);
for (const row of posts) {
  console.log(
    `${row.status.padEnd(9)} brief ${String(row.briefScore).padStart(3)} @${row.handle} ${row.postedAt} | ${row.views} views, ${((row.engagementRate ?? 0) * 100).toFixed(1)}% engaged | flags: ${row.flags?.join(", ") || "none"} | earns $${row.payout}\n   ${row.caption.replace(/\s+/g, " ").slice(0, 90)}\n   > ${row.feedback}`,
  );
}
