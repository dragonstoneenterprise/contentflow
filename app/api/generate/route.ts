import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementUsage } from "@/lib/usage";

// ─── Per-format generation prompts ───────────────────────────────────────────

const BLOG_GEN_PROMPT = `You are a content repurposing expert. Given a transcript, write a well-structured blog post (800-1200 words) with a compelling title, intro, body with subheadings, and conclusion.

Respond ONLY with a raw JSON object. No markdown, no backticks, no explanation. Start with { and end with }:
{"blog": "Full blog post text here..."}`;

const TWEETS_GEN_PROMPT = `You are a content repurposing expert. Given a transcript, write a Twitter/X thread (7-10 tweets, each under 280 characters, with a strong hook on tweet 1 and engagement throughout).

Respond ONLY with a raw JSON object. No markdown, no backticks, no explanation. Start with { and end with }:
{"tweets": ["Tweet 1", "Tweet 2", "..."]}`;

const SHORTS_GEN_PROMPT = `You are a content repurposing expert. Given a transcript, write a YouTube Shorts script (60-90 seconds, punchy opening hook, fast-paced delivery, with visual cues in brackets).

Respond ONLY with a raw JSON object. No markdown, no backticks, no explanation. Start with { and end with }:
{"shorts": "Full shorts script here..."}`;

// ─── Per-format humanizer prompts ────────────────────────────────────────────

const HUMANIZER_RULES = `HARD RULES — no exceptions:
- DELETE these words entirely: delve, leverage, utilize, facilitate, streamline, transformative, synergy, robust, comprehensive, invaluable, actionable, nuanced
- DELETE these phrases: "In conclusion", "It's worth noting", "It's important to remember", "Furthermore", "Moreover", "Additionally", "In summary", "Takeaway"
- DELETE em dashes (—) replace with a comma or period
- DELETE "the power of X" constructions
- DELETE corporate jargon like "return on investment", "mental bandwidth", "higher-value work"
- BREAK UP any paragraph longer than 4 sentences
- VARY sentence length aggressively — mix 5 word sentences with 20 word sentences
- START some sentences with "And" or "But" — real people do this
- USE contractions: don't, it's, you're, I've, wasn't
- WRITE like you're texting a smart friend, not presenting to a board`;

const BLOG_HUMANIZER_PROMPT = `You are a ruthless editor who rewrites AI-generated blog posts to sound like a real human wrote them.

${HUMANIZER_RULES}

Return ONLY raw JSON, no markdown, starting with {: {"blog": "humanized blog text here..."}`;

const TWEETS_HUMANIZER_PROMPT = `You are a ruthless editor who rewrites AI-generated tweet threads to sound like a real human wrote them.

${HUMANIZER_RULES}

Return ONLY raw JSON, no markdown, starting with {: {"tweets": ["tweet 1", "tweet 2", "..."]}`;

const SHORTS_HUMANIZER_PROMPT = `You are a ruthless editor who rewrites AI-generated Shorts scripts to sound like a real human wrote them.

${HUMANIZER_RULES}

Return ONLY raw JSON, no markdown, starting with {: {"shorts": "humanized shorts script here..."}`;

// ─── OpenRouter helper ────────────────────────────────────────────────────────

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
      "X-Title": "Snipflow",
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

// ─── Per-format pipeline: generate → humanize (sequential within format) ─────
// All three format pipelines run in parallel via Promise.all in the handler.

async function generateAndHumanize<T extends object>(
  apiKey: string,
  model: string,
  humanizerModel: string,
  genPrompt: string,
  humanizePrompt: string,
  userContent: string,
  fallback: T
): Promise<T> {
  const generated: T = await callOpenRouter(apiKey, model, genPrompt, userContent, 0.5);
  try {
    const humanized: T = await callOpenRouter(
      apiKey,
      humanizerModel,
      humanizePrompt,
      `Humanize this content and return the same JSON structure:\n${JSON.stringify(generated)}`,
      0.7
    );
    return humanized;
  } catch (err) {
    console.error("Humanizer failed, returning original:", err);
    return generated;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

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

    const userContent = `Repurpose this transcript:\n\n${transcript}`;

    // Run all three format pipelines in parallel.
    // Each pipeline: generate → humanize (sequential within the pipeline).
    // Blog, tweets, and shorts are fully independent so they fire simultaneously.
    let blogResult: { blog: string };
    let tweetsResult: { tweets: string[] };
    let shortsResult: { shorts: string };

    try {
      [blogResult, tweetsResult, shortsResult] = await Promise.all([
        generateAndHumanize<{ blog: string }>(
          OPENROUTER_API_KEY, MODEL, HUMANIZER_MODEL,
          BLOG_GEN_PROMPT, BLOG_HUMANIZER_PROMPT,
          userContent, { blog: "" }
        ),
        generateAndHumanize<{ tweets: string[] }>(
          OPENROUTER_API_KEY, MODEL, HUMANIZER_MODEL,
          TWEETS_GEN_PROMPT, TWEETS_HUMANIZER_PROMPT,
          userContent, { tweets: [] }
        ),
        generateAndHumanize<{ shorts: string }>(
          OPENROUTER_API_KEY, MODEL, HUMANIZER_MODEL,
          SHORTS_GEN_PROMPT, SHORTS_HUMANIZER_PROMPT,
          userContent, { shorts: "" }
        ),
      ]);
    } catch {
      return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 502 });
    }

    return NextResponse.json({
      blog: blogResult.blog,
      tweets: tweetsResult.tweets,
      shorts: shortsResult.shorts,
      remaining: usage.remaining,
      plan: usage.plan,
    });

  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
