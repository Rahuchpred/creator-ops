import { readImage } from "@/lib/media";

// Serves the saved copies of creator profile pictures and video covers.
export async function GET(_request: Request, context: RouteContext<"/api/media/[name]">) {
  const { name } = await context.params;
  const image = await readImage(name);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      // The file name is a hash of what it shows, so it never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
