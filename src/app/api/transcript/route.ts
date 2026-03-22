import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }

  // Approach 1: Use youtube-transcript-plus
  try {
    const { fetchTranscript } = await import("youtube-transcript-plus");
    const segments = await fetchTranscript(videoId, { lang: "en" });
    if (segments && segments.length > 0) {
      const transcript = segments.map((s: any) => s.text).join(" ");
      return NextResponse.json({ transcript });
    }
  } catch {}

  // Approach 2: Try without language preference
  try {
    const { fetchTranscript } = await import("youtube-transcript-plus");
    const segments = await fetchTranscript(videoId);
    if (segments && segments.length > 0) {
      const transcript = segments.map((s: any) => s.text).join(" ");
      return NextResponse.json({ transcript });
    }
  } catch {}

  // Approach 3: Direct scrape as fallback
  try {
    const watchRes = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml",
        },
      }
    );

    const html = await watchRes.text();
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (captionMatch) {
      const tracks = JSON.parse(captionMatch[1]);
      const track =
        tracks.find((t: any) => t.languageCode === "en" && t.kind !== "asr") ||
        tracks.find((t: any) => t.languageCode === "en") ||
        tracks[0];

      if (track?.baseUrl) {
        const transcriptRes = await fetch(track.baseUrl);
        const xml = await transcriptRes.text();
        const lines: string[] = [];
        const regex = /<text[^>]*>(.*?)<\/text>/g;
        let match;
        while ((match = regex.exec(xml)) !== null) {
          const text = match[1]
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n/g, " ")
            .trim();
          if (text) lines.push(text);
        }
        if (lines.length > 0) {
          return NextResponse.json({ transcript: lines.join(" ") });
        }
      }
    }
  } catch {}

  return NextResponse.json(
    { error: "Could not fetch transcript. Try pasting it manually." },
    { status: 500 }
  );
}
