import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }
  try {
    const res = await fetch(`http://localhost:3001/?videoId=${videoId}`);
    const data = await res.json();
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Transcript service unavailable. Paste transcript manually." }, { status: 500 });
  }
}