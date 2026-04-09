import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementUsage } from "@/lib/usage";

const SYSTEM_PROMPT = `You are Idea Extractor — an AI that takes raw content (transcripts, notes, captions from social media, videos, podcasts, etc.) and turns them into a prioritized, actionable plan.

Your job is to extract and prioritize actionable ideas from the provided content.

Here's how to process the content:
1.  **Extract Ideas**: Identify every distinct, actionable idea, insight, or task.
2.  **Assess Each Idea**: For each extracted idea, provide the following assessments:
    *   **IMPACT (1-10)**: How much value or positive outcome will this create if executed? (1=low, 10=high)
    *   **EFFORT (1-10)**: How much work, time, or resources are required to implement this? (1=very easy, 10=very massive undertaking)
    *   **URGENCY (1-10)**: How time-sensitive is this idea? Does it need to be done soon to capture an opportunity or avoid a problem? (1=not urgent, 10=immediate action needed)
    *   **CONFIDENCE (1-10)**: How certain are you in the accuracy and relevance of this extracted idea and its assessments based on the provided content? (1=low certainty, 10=high certainty)
3.  **Calculate PRIORITY SCORE**: Use the formula: '(Impact × 2 + Urgency × 1.5 + Confidence) / Effort'.
4.  **Sort**: Order the ideas by their 'priority_score' in descending order (highest priority first).
5.  **Develop Next Step**: For each idea, provide a concrete, specific, and actionable 'next_step'. Suggest specific tools or methods if appropriate.
6.  **Explain "Why"**: Briefly explain in one sentence why each idea matters or its potential benefit.

Respond ONLY with valid JSON. Do not include any markdown, backticks, or preamble. Your output must strictly adhere to this JSON structure:
{
  "title": "A concise, engaging title summarizing the main theme or focus of the extracted ideas",
  "ideas": [
    {
      "id": 1,
      "idea": "A clear, concise, and actionable description of the idea or insight.",
      "category": "one of: Revenue | Growth | Product | Content | Operations | Learning | Marketing | Strategy | Other",
      "impact": 8,
      "effort": 3,
      "urgency": 7,
      "confidence": 9,
      "priority_score": 7.2,
      "next_step": "A specific, concrete action to take right now, e.g., 'Draft an email to X stakeholder using Y template.'",
      "why": "One sentence explaining the strategic importance or potential benefit of this idea."
    }
  ],
  "quick_wins": ["List of 2-3 highest impact, lowest effort ideas, rephrased as immediate, concise actions (e.g., 'Publish X blog post', 'Schedule Y meeting'). These should be extracted from the 'ideas' array."],
  "summary": "A 2-3 sentence synthesis of the overall themes, key takeaways, and recommended immediate focus areas based on the extracted ideas."
}
If the provided content is empty, too short, or lacks discernible ideas, return a JSON with an empty 'ideas' array and a 'summary' that suggests providing more comprehensive content.
`;

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
