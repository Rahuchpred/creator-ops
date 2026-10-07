// Reads a pasted TikTok video link: who posted it and which video it is.

const VIDEO = /tiktok\.com\/@([\w.]+)\/(?:video|photo)\/(\d+)/i;
const SHORT = /^https?:\/\/(?:vm|vt)\.tiktok\.com\/|^https?:\/\/(?:www\.)?tiktok\.com\/t\//i;

export type VideoLink = { handle: string; videoId: string };

export async function readVideoLink(pasted: string): Promise<VideoLink> {
  let link = pasted.trim();

  // Share links from the app are short and only say where they lead once
  // they are followed.
  if (SHORT.test(link)) {
    try {
      const response = await fetch(link, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
      link = response.url;
    } catch {
      throw new Error("That short link could not be opened. Paste the full link from the browser.");
    }
  }

  const match = VIDEO.exec(link);
  if (!match) {
    throw new Error(
      "That is not a TikTok video link. It should look like https://www.tiktok.com/@name/video/123.",
    );
  }
  return { handle: match[1].toLowerCase(), videoId: match[2] };
}
