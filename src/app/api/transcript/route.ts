import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    const transcript = transcriptItems.map((item) => item.text).join(" ");
    return NextResponse.json({ transcript });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch transcript. Try pasting manually." },
      { status: 500 }
    );
  }
}
















