import { z } from "zod";
import { readOutreach } from "@/lib/files";
import { saveOutreach } from "@/lib/store";

const Body = z.object({ handle: z.string().trim().min(1) });

// Marks one draft as approved. Approving sends nothing to the creator.
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json(
      { message: "Send the creator's handle to approve a draft." },
      { status: 400 },
    );
  }

  const outreach = (await readOutreach()) ?? [];
  const draft = outreach.find((row) => row.handle === body.data.handle);
  if (!draft) {
    return Response.json(
      { message: `There is no draft for @${body.data.handle}. Refresh the page and try again.` },
      { status: 404 },
    );
  }

  const approved = { ...draft, status: "Approved" as const };
  await saveOutreach(outreach.map((row) => (row.handle === draft.handle ? approved : row)));
  return Response.json(approved);
}
