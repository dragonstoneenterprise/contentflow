import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || transcript.length < 50) {
      return NextResponse.json({ error: "Transcript too short" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 500 });
    }

    // Truncate transcript if too long
    const maxLength = 8000;
    const truncatedTranscript = transcript.length > maxLength 
      ? transcript.substring(0, maxLength) + "..."
      : transcript;

    // Generate all content in one call using a smart prompt
    const prompt = `You are a content repurposing expert. Transform this transcript into 3 outputs:

TRANSCRIPT:
${truncatedTranscript}

OUTPUT FORMAT (JSON only, no markdown):
{
  "blog": "A SEO-optimized blog post with intro, main points, and conclusion. 400-600 words.",
  "tweets": ["Tweet 1 (280 chars max, engaging hook)", "Tweet 2 (key insight)", "Tweet 3 (value drop)", "Tweet 4 (build anticipation)", "Tweet 5 (CTA with question)"],
  "shorts": "A YouTube Shorts script with: hook (3 sec), value (45 sec), CTA (12 sec). Total ~60 sec."
}

Rules:
- Blog: Use markdown formatting, include H2 headers, make it scannable
- Tweets: Each must be under 280 chars, engaging, no thread numbers
- Shorts: Script format with visual/action notes, conversational
- Keep the core message and insights from the transcript
- Output valid JSON only, no explanations`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://contentflow.app",
        "X-Title": "ContentFlow",
      },
      body: JSON.stringify({
        model: "minimax/minimax-m2.1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    // Parse JSON from response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("JSON parse error:", content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Validate and return
    return NextResponse.json({
      blog: parsed.blog || "",
      tweets: Array.isArray(parsed.tweets) ? parsed.tweets : [],
      shorts: parsed.shorts || "",
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}