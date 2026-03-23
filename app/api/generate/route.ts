import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementUsage } from "@/lib/usage";

// NOTE: Keep your existing generation logic — this wrapper just adds auth + usage
// Replace the SYSTEM_PROMPT and MODEL with whatever your current /api/generate uses

const SYSTEM_PROMPT = `You are a content repurposing expert. Given a transcript, create three pieces of content:

1. A well-structured blog post (800-1200 words) with a compelling title, intro, body with subheadings, and conclusion
2. A Twitter/X thread (7-10 tweets, each under 280 characters, with hooks and engagement)
3. A YouTube Shorts script (60-90 seconds, punchy opening hook, fast-paced, with visual cues)

Respond ONLY with valid JSON (no markdown, no backticks, no preamble):
{
  "blog": "Full blog post text here...",
  "tweets": ["Tweet 1", "Tweet 2", "..."],
  "shorts": "Full shorts script here..."
}`;

export async function POST(req: NextRequest) {
  try {
    // Check auth + usage
    const usage = await checkAndIncrementUsage();
    if (!usage.allowed) {
      return NextResponse.json(
        { error: usage.error, remaining: usage.remaining, plan: usage.plan },
        { status: 429 }
      );
    }

    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const MODEL = process.env.GENERATE_MODEL || "google/gemini-flash-1.5";

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://contentflow.app",
        "X-Title": "ContentFlow",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Repurpose this transcript into 3 formats:\n\n${transcript}` },
        ],
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("OpenRouter error:", errData);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      return NextResponse.json({ ...parsed, remaining: usage.remaining, plan: usage.plan });
    } catch {
      return NextResponse.json({ error: "AI returned invalid format. Try again." }, { status: 502 });
    }
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
