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

const HUMANIZER_PROMPT = `You are a writing editor that makes AI-generated content sound natural and human.

Rules:
- Remove AI vocabulary: delve, leverage, utilize, facilitate, streamline, it's worth noting, it's important to remember, in conclusion, furthermore, moreover, additionally
- Remove em dashes and replace with commas or periods
- Mix short and long sentences. Short ones hit hard. Longer ones let the idea breathe before moving on.
- Cut corporate jargon, replace with plain language
- Make tweets sound like a real person typed them
- Keep ALL JSON fields exactly as they are

Respond ONLY with a raw JSON object. No markdown, no backticks, no explanation, no preamble. Start your response with { and end with }.`;

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

    // Step 1: Generate
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

    // Step 2: Humanize (fail-safe — returns original if it breaks)
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