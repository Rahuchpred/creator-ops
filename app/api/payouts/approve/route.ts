import { z } from "zod";
import { readPayoutApprovals, readPosts, savePayoutApprovals } from "@/lib/files";

const Body = z.object({
  approvals: z
    .array(z.object({ postId: z.string().trim().min(1), amount: z.number().positive() }))
    .min(1)
    .max(200),
});

// Records a person's approval of what each post earns. An approval is for
// one post at one amount. Approving moves no money.
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json(
      { message: "Send the posts and amounts to approve a payout." },
      { status: 400 },
    );
  }

  // Only what the page showed is approved. If a review changed a post in the
  // meantime, the person looks again before signing off.
  const posts = (await readPosts()) ?? [];
  const current = body.data.approvals.every(({ postId, amount }) =>
    posts.some((post) => post.id === postId && post.status === "Approved" && post.payout === amount),
  );
  if (!current) {
    return Response.json(
      { message: "These payouts changed since the page loaded. Refresh the page and approve again." },
      { status: 409 },
    );
  }

  const approvedAt = new Date().toISOString();
  const ids = new Set(body.data.approvals.map(({ postId }) => postId));
  const approvals = [
    ...body.data.approvals.map((approval) => ({ ...approval, approvedAt })),
    ...(await readPayoutApprovals()).filter((approval) => !ids.has(approval.postId)),
  ];
  await savePayoutApprovals(approvals);
  return Response.json({ approved: body.data.approvals.length });
}
