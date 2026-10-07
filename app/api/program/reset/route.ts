import { clearResults } from "@/lib/program-run";

// Empties the screens so the program can be run from the start again. The
// program itself stays, and the old results are set aside, not deleted.
export async function POST() {
  await clearResults();
  return Response.json({ cleared: true });
}
