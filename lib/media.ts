// Saves TikTok images to disk. TikTok's image links are signed and stop
// working after a while, so a roster or post that kept the link would lose
// its pictures. A saved copy is served from /api/media instead.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), ".data", "media");

// The formats every browser can show. TikTok also serves HEIC, which most
// cannot, so those are skipped.
const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/png": "png",
};
const CONTENT_TYPE = Object.fromEntries(
  Object.entries(EXTENSION).map(([type, extension]) => [extension, type]),
);

const FILE = /^[a-f0-9]{24}\.(jpg|webp|png)$/;

// Prefers a link in a format browsers can show.
export function pickImage(links: string[] | undefined): string | undefined {
  if (!links?.length) return undefined;
  return (
    links.find((link) => /\.(jpe?g|webp|png)(\?|$)/i.test(link)) ??
    links.find((link) => !/\.heic(\?|$)/i.test(link)) ??
    links[0]
  );
}

// Downloads one image and returns the local path to show it from, or
// nothing when it cannot be saved. A missing picture never fails a run.
export async function saveImage(link: string | undefined, key: string): Promise<string | undefined> {
  if (!link) return undefined;
  try {
    const response = await fetch(link, { signal: AbortSignal.timeout(15_000) });
    const extension = EXTENSION[response.headers.get("content-type")?.split(";")[0] ?? ""];
    if (!response.ok || !extension) return undefined;

    const name = `${createHash("sha256").update(key).digest("hex").slice(0, 24)}.${extension}`;
    await mkdir(DIR, { recursive: true });
    await writeFile(path.join(DIR, name), Buffer.from(await response.arrayBuffer()));
    return `/api/media/${name}`;
  } catch {
    return undefined;
  }
}

export async function readImage(name: string) {
  if (!FILE.test(name)) return null;
  try {
    const bytes = await readFile(path.join(DIR, name));
    return { bytes, contentType: CONTENT_TYPE[name.split(".")[1]] };
  } catch {
    return null;
  }
}
