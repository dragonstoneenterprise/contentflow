# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This project: Snipflow (production)
Next.js 14 app with Supabase auth and OpenRouter AI. Deployed on Railway (auto-deploys on `git push`).

- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Env vars required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, `GENERATE_MODEL`, `IDEA_EXTRACTOR_MODEL`, `NEXT_PUBLIC_APP_URL`

**Architecture:**

`app/page.tsx` is a single `"use client"` component that handles all UI — auth modal (email/password + Google OAuth), the two main tools (content generator and idea extractor), and usage display. It talks to Supabase directly for auth state and calls the API routes for AI generation.

`app/api/generate/route.ts` — POST. Calls `checkAndIncrementUsage()` first, then sends the transcript to OpenRouter (`GENERATE_MODEL`). Returns `{ blog, tweets, shorts }` as JSON. Both API routes strip markdown fences from the AI response before parsing JSON.

`app/api/extract-ideas/route.ts` — POST. Same auth+usage gate, uses `IDEA_EXTRACTOR_MODEL`. Returns `{ title, ideas[], quick_wins[], summary }` where each idea has `impact`, `effort`, `urgency`, and a computed `priority_score = (impact×2 + urgency×1.5) / effort`.

`lib/usage.ts` — `checkAndIncrementUsage()` reads the `profiles` table, resets `daily_usage` to 0 if `last_reset` date differs from today, checks against plan limit (free=3, pro=999999), then atomically increments both `daily_usage` and `total_usage`.

`lib/supabase/client.ts` / `server.ts` — Browser vs. server Supabase client helpers (using `@supabase/ssr`).

`middleware.ts` — Runs on all non-static routes; just refreshes the Supabase session cookie.

`supabase-setup.sql` — Creates the `profiles` table, auto-creates a profile row on signup via a trigger, and sets RLS policies.

AI model is configurable via env vars without redeploying.

**Upgrading users to pro (manual for now):**
```sql
UPDATE profiles SET plan = 'pro' WHERE email = 'user@email.com';
```

---

## v2 prototype: ~/Desktop/Projects/Snipflow/contentflow
Next.js 16 / React 19 version. No Supabase — auth-free with usage gating via `localStorage`. Deployed to Vercel.

- **Dev:** `npm run dev` from `~/Desktop/Projects/Snipflow/contentflow/`
- **Build:** `npm run build`
- **Lint:** `eslint`
- **Env vars required:** `OPENROUTER_API_KEY` (also accepts `OPENAI_API_KEY` as fallback)

**Architecture:**

`src/app/page.tsx` — Single `"use client"` component. Tracks usage count in `localStorage` (free limit: 3). After 3 generations, shows an email capture modal before allowing more. No server-side auth.

`src/app/api/transcript/route.ts` — GET `?videoId=`. Fetches the YouTube watch page HTML server-side, parses `captionTracks` JSON out of the page source, fetches the caption XML, and returns plain text. Prefers manual English captions over auto-generated (`asr`), falls back to first available track.

`src/app/api/generate/route.ts` — POST. Takes `{ transcript }`, truncates to 8000 chars, calls OpenRouter with the hardcoded model `minimax/minimax-m2.1`. Extracts JSON from the response using a regex (`/\{[\s\S]*\}/`) rather than stripping fences. Returns `{ blog, tweets[], shorts }`.

`api/transcript-proxy.py` — Standalone Python HTTP server on port 3001 using `youtube_transcript_api`. An alternative transcript backend; not wired into the Next.js app by default.
