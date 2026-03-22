import { NextRequest, NextResponse } from "next/server";
import { fetchTranscript } from "youtube-transcript-plus";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }

  try {
    const segments = await fetchTranscript(videoId, { lang: "en" });

    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: "No transcript found. Try pasting it manually." },
        { status: 404 }
      );
    }

    const transcript = segments.map((s: any) => s.text).join(" ");
    return NextResponse.json({ transcript });
  } catch {
    try {
      const segments = await fetchTranscript(videoId);
      if (!segments || segments.length === 0) {
        return NextResponse.json(
          { error: "No transcript available. Try pasting it manually." },
          { status: 404 }
        );
      }
      const transcript = segments.map((s: any) => s.text).join(" ");
      return NextResponse.json({ transcript });
    } catch {
      return NextResponse.json(
        { error: "Could not fetch transcript. Try pasting it manually." },
        { status: 500 }
      );
    }
  }
}
