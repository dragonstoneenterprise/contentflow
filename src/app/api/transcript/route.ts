import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await res.text();
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) {
      return NextResponse.json({ error: "No captions found for this video." }, { status: 404 });
    }
    const tracks = JSON.parse(captionMatch[1]);
    const track =
      tracks.find((t: any) => t.languageCode === "en" && t.kind !== "asr") ||
      tracks.find((t: any) => t.languageCode === "en") ||
      tracks[0];
    if (!track?.baseUrl) {
      return NextResponse.json({ error: "No transcript available." }, { status: 404 });
    }
    const tRes = await fetch(track.baseUrl);
    const xml = await tRes.text();
    const lines: string[] = [];
    const regex = /<text[^>]*>(.*?)<\/text>/g;
    let m;
    while ((m = regex.exec(xml)) !== null) {
      const text = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n/g, " ").trim();
      if (text) lines.push(text);
    }
    if (lines.length === 0) {
      return NextResponse.json({ error: "Transcript was empty." }, { status: 404 });
    }
    return NextResponse.json({ transcript: lines.join(" ") });
  } catch {
    return NextResponse.json({ error: "Could not fetch transcript. Try pasting it manually." }, { status: 500 });
  }
}
