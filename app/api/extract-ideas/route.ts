import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementUsage } from "@/lib/usage";

const SYSTEM_PROMPT = `You are Idea Extractor — an AI that takes raw content (transcripts, notes, captions from social media, videos, podcasts, etc.) and turns them into a prioritized, actionable plan.

Your job:
1. Extract every distinct idea, insight, or actionable item from the content
2. For each idea, assess:
   - IMPACT (1-10): How much value does this create if executed?
   - EFFORT (1-10): How much work to implement? (1=easy, 10=massive)
   - URGENCY (1-10): How time-sensitive is this?
3. Calculate a PRIORITY SCORE = (Impact × 2 + Urgency × 1.5) / Effort
4. Sort by priority score, highest first
5. For each idea, provide a concrete next step

Respond ONLY with valid JSON (no markdown, no backticks, no preamble). Use this exact structure:
{
  "title": "Brief title summarizing the content theme",
  "ideas": [
    {
      "id": 1,
      "idea": "Clear, concise description of the idea",
      "category": "one of: Revenue | Growth | Product | Content | Operations | Learning",
      "impact": 8,
      "effort": 3,
      "urgency": 7,
      "priority_score": 7.2,
      "next_step": "Specific, concrete action to take right now",
      "why": "One sentence on why this matters"
    }
  ],
  "quick_wins": ["List of ideas that are high impact + low effort (do these first)"],
  "summary": "2-3 sentence synthesis of the overall theme and recommended focus"
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

    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const MODEL = process.env.IDEA_EXTRACTOR_MODEL || "google/gemini-flash-1.5";

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://contentflow.app",
        "X-Title": "ContentFlow Idea Extractor",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extract and prioritize ideas from this content:\n\n${content}` },
        ],
        temperature: 0.3,
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
    console.error("Extract ideas error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
