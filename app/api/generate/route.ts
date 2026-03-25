import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementUsage } from "@/lib/usage";

const SYSTEM_PROMPT = `You are a content repurposing expert. Given a transcript, create three pieces of content:

1. A well-structured blog post (800-1200 words) with a compelling title, intro, body with subheadings, and conclusion
2. A Twitter/X thread (7-10 tweets, each under 280 characters, with hooks and engagement)
3. A YouTube Shorts script (60-90 seconds, punchy opening hook, fast-paced, with visual cues)

Respond ONLY with a raw JSON object. No markdown, no backticks, no explanation, no preamble. Start your response with { and end with }:
{
  "blog": "Full blog post text here...",
  "tweets": ["Tweet 1", "Tweet 2", "..."],
  "shorts": "Full shorts script here..."
}`;

const HUMANIZER_PROMPT = `You are a ruthless editor who rewrites AI-generated content to sound like a real human wrote it.

HARD RULES — no exceptions:
- DELETE these words entirely: delve, leverage, utilize, facilitate, streamline, transformative, synergy, robust, comprehensive, invaluable, actionable, nuanced
- DELETE these phrases: "In conclusion", "It's worth noting", "It's important to remember", "Furthermore", "Moreover", "Additionally", "In summary", "Takeaway"
- DELETE em dashes (—) replace with a comma or period
- DELETE "the power of X" constructions
- DELETE corporate jargon like "return on investment", "mental bandwidth", "higher-value work"
- BREAK UP any paragraph longer than 4 sentences
- VARY sentence length aggressively — mix 5 word sentences with 20 word sentences
- START some sentences with "And" or "But" — real people do this
- USE contractions: don't, it's, you're, I've, wasn't
- WRITE like you're texting a smart friend, not presenting to a board

Keep ALL JSON fields intact. Return ONLY raw JSON, no markdown, starting with {`;

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string,
  temperature: number
) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://contentflow.app",
      "X-Title": "ContentFlow",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error("OpenRouter error:", errData);
    throw new Error("OpenRouter request failed");
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(req: NextRequest) {
  try {
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
    const HUMANIZER_MODEL = process.env.HUMANIZER_MODEL || "google/gemini-flash-1.5";

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    let parsed;
    try {
      parsed = await callOpenRouter(
        OPENROUTER_API_KEY,
        MODEL,
        SYSTEM_PROMPT,
        `Repurpose this transcript into 3 formats:\n\n${transcript}`,
        0.5
      );
    } catch {
      return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 502 });
    }

    try {
      const humanized = await callOpenRouter(
        OPENROUTER_API_KEY,
        HUMANIZER_MODEL,
        HUMANIZER_PROMPT,
        `Humanize this content and return the same JSON structure:\n${JSON.stringify(parsed)}`,
        0.7
      );
      return NextResponse.json({ ...humanized, remaining: usage.remaining, plan: usage.plan });
    } catch (err) {
      console.error("Humanizer failed, returning original:", err);
      return NextResponse.json({ ...parsed, remaining: usage.remaining, plan: usage.plan });
    }

  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}