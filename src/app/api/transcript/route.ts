import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = transcript.map((item) => item.text).join(" ");
    return NextResponse.json({ transcript: text });
  } catch (error) {
    console.error("Transcript error:", error);
    return NextResponse.json({ error: "Failed to fetch transcript" }, { status: 500 });
  }
}