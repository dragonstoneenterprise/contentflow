import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }

  const errors: string[] = [];

  // Approach 1: youtube-transcript-plus
  try {
    const { fetchTranscript } = await import("youtube-transcript-plus");
    const segments = await fetchTranscript(videoId, { lang: "en" });
    if (segments && segments.length > 0) {
      const transcript = segments.map((s: any) => s.text).join(" ");
      return NextResponse.json({ transcript });
    }
    errors.push("Approach 1: no segments");
  } catch (e: any) {
    errors.push("Approach 1: " + (e?.message || String(e)));
  }

  // Approach 2: direct fetch
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await res.text();
    errors.push("Approach 2: page length " + html.length);
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (captionMatch) {
      const tracks = JSON.parse(captionMatch[1]);
      const track =
        tracks.find((t: any) => t.languageCode === "en" && t.kind !== "asr") ||
        tracks.find((t: any) => t.languageCode === "en") ||
        tracks[0];
      if (track?.baseUrl) {
        const tRes = await fetch(track.baseUrl);
        const xml = await tRes.text();
        const lines: string[] = [];
        const regex = /<text[^>]*>(.*?)<\/text>/g;
        let m;
        while ((m = regex.exec(xml)) !== null) {
          const text = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n/g, " ").trim();
          if (text) lines.push(text);
        }
        if (lines.length > 0) {
          return NextResponse.json({ transcript: lines.join(" ") });
        }
        errors.push("Approach 2: XML had 0 lines");
      } else {
        errors.push("Approach 2: no baseUrl in track");
      }
    } else {
      errors.push("Approach 2: no captionTracks in HTML");
    }
  } catch (e: any) {
    errors.push("Approach 2: " + (e?.message || String(e)));
  }

  return NextResponse.json(
    { error: "Could not fetch transcript. Try pasting it manually.", debug: errors },
    { status: 500 }
  );
}
