import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementUsage } from "@/lib/usage";

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

const HUMANIZER_PROMPT = `You are a writing editor that makes AI-generated content sound natural and human.

Apply these rules to the JSON content you receive:
- Remove AI vocabulary: "delve", "leverage", "utilize", "facilitate", "streamline", "it's worth noting", "it's important to remember", "in conclusion", "furthermore", "moreover"
- Remove em dashes (—) and replace with commas or periods
- Break up uniform sentence lengths — mix short punchy sentences with longer ones
- Remove "rule of three" lists where everything is the same length
- Cut corporate jargon and replace with plain language
- Make tweets sound like a real person typed them, not a press release
- Keep the exact same JSON structure and all fields intact

Respond ONLY with valid JSON (no markdown, no backticks, no preamble) with the same structure:
{
  "blog": "...",
  "tweets": ["...", "..."],
  "shorts": "..."
}`;

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

    // Step 1: Generate content
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

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "AI returned invalid format. Try again." }, { status: 502 });
    }

    // Step 2: Humanize the output
    try {
      const humanizerRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://contentflow.app",
          "X-Title": "ContentFlow",
        },
        body: JSON.stringify({
          model: HUMANIZER_MODEL,
          messages: [
            { role: "system", content: HUMANIZER_PROMPT },
            { role: "user", content: JSON.stringify(parsed) },
          ],
          temperature: 0.7,
        }),
      });

      if (humanizerRes.ok) {
        const humanizerData = await humanizerRes.json();
        const humanizerText = humanizerData.choices?.[0]?.message?.content || "";
        const humanizerClean = humanizerText.replace(/```json|```/g, "").trim();
        const humanized = JSON.parse(humanizerClean);
        return NextResponse.json({ ...humanized, remaining: usage.remaining, plan: usage.plan });
      }
    } catch (humanizerErr) {
      // If humanizer fails, fall back to original output — don't break the app
      console.error("Humanizer failed, using original output:", humanizerErr);
    }

    // Fallback: return original if humanizer failed
    return NextResponse.json({ ...parsed, remaining: usage.remaining, plan: usage.plan });

  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}