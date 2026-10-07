// Adds profile pictures to a roster saved before pictures were kept, without
// rerunning the Research agent. One-off: bun run pictures:backfill
import { readRoster, saveRoster } from "@/lib/files";
import { saveImage } from "@/lib/media";
import { fetchCreator, type Budget } from "@/lib/research/tiktok";

const roster = await readRoster();
if (!roster) {
  console.error("There is no saved roster. Run the Research agent first.");
  process.exit(1);
}

const budget: Budget = { callsLeft: roster.length * 2 };
let added = 0;
for (const creator of roster) {
  if (creator.avatar) continue;
  try {
    const fetched = await fetchCreator(creator.handle, budget);
    creator.avatar = await saveImage(fetched.avatarLink, `avatar:${creator.handle}`);
    if (creator.avatar) added += 1;
  } catch (error) {
    console.log(`@${creator.handle}: skipped, ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
await saveRoster(roster);
console.log(`Added ${added} profile pictures to ${roster.length} creators`);
