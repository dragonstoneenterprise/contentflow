# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a home directory, not a single unified project. It contains a few independent small projects.

## Projects

### Desktop/contentflow (production)
Next.js 14 app with Supabase auth and OpenRouter AI. Deployed on Railway (auto-deploys on `git push`).

- **Dev:** `npm run dev` from `~/Desktop/contentflow/`
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

### Desktop/Projects/ContentFlow/contentflow (v2 prototype)
Newer Next.js 16 / React 19 version of ContentFlow. No Supabase — auth-free with usage gating via `localStorage`. Deployed to Vercel.

- **Dev:** `npm run dev` from `~/Desktop/Projects/ContentFlow/contentflow/`
- **Build:** `npm run build`
- **Lint:** `eslint`
- **Env vars required:** `OPENROUTER_API_KEY` (also accepts `OPENAI_API_KEY` as fallback)

**Architecture:**

`src/app/page.tsx` — Single `"use client"` component. Tracks usage count in `localStorage` (free limit: 3). After 3 generations, shows an email capture modal before allowing more. No server-side auth.

`src/app/api/transcript/route.ts` — GET `?videoId=`. Fetches the YouTube watch page HTML server-side, parses `captionTracks` JSON out of the page source, fetches the caption XML, and returns plain text. Prefers manual English captions over auto-generated (`asr`), falls back to first available track.

`src/app/api/generate/route.ts` — POST. Takes `{ transcript }`, truncates to 8000 chars, calls OpenRouter with the hardcoded model `minimax/minimax-m2.1`. Extracts JSON from the response using a regex (`/\{[\s\S]*\}/`) rather than stripping fences. Returns `{ blog, tweets[], shorts }`.

`api/transcript-proxy.py` — Standalone Python HTTP server on port 3001 using `youtube_transcript_api`. An alternative transcript backend; not wired into the Next.js app by default.

---

### Desktop/Projects/Fleet/yt-worker (Cloudflare Worker)
Cloudflare Worker (`yt-transcript`) that handles YouTube transcript fetching, managed via Wrangler.

- **Dev:** `npx wrangler dev` from `~/Desktop/Projects/Fleet/yt-worker/`
- **Deploy:** `npx wrangler deploy`
- Entry point: `src/index.js`

**Architecture:**

Single-file Worker (`src/index.js`). Accepts GET `?v=<videoId>`. Fetches the YouTube watch page, parses `captionTracks` from the HTML source, fetches the caption XML from the track's `baseUrl`, and returns the transcript as plain joined text. Same caption-preference logic as the v2 Next.js route (manual English → auto-generated English → first available). All responses include `Access-Control-Allow-Origin: *` so it can be called from any frontend. No auth, no KV, no bindings.

---

### AndroidStudioProjects/MyApplication
Android app (Kotlin, Gradle Kotlin DSL, AGP 8.10.1, Kotlin 2.0.21). minSdk 24, targetSdk 35. Currently the stock Android Studio "Navigation" template — no custom business logic yet.

- **Build:** `./gradlew assembleDebug` from `AndroidStudioProjects/MyApplication/`
- **Run unit tests:** `./gradlew test`
- **Run instrumented tests:** `./gradlew connectedAndroidTest`
- **Install on device:** `./gradlew installDebug`

**Architecture:**

Uses the Jetpack Navigation component with View Binding. `MainActivity` hosts a single `NavHostFragment` (`R.id.nav_host_fragment_content_main`) and wires up the action bar to the nav controller. The nav graph (`res/navigation/nav_graph.xml`) defines two destinations: `FirstFragment` → `SecondFragment`. Dependencies are declared in the version catalog at `gradle/libs.versions.toml`.

### yt-test
A small Node.js ESM script for testing YouTube transcript fetching via the `youtube-transcript-plus` library.

- **Run:** `node test-transcript.mjs` from `yt-test/`
- **Install deps:** `npm install` from `yt-test/`

---

## Business Context
- **Dragonstone Enterprises** — AI digital products (ContentFlow, CallReady)
- **Cryptic Dragon LLC** — Apple product resale (BFMR/Amazon/eBay), California LLC
- **Email:** contact@dragonstone.online

## Other Products
- **CallReady** — AI earnings call prep, live at callready-pi.vercel.app ($49/$297/$497/mo)
  - Needs: rename "Try Demo" → "Book a Demo", Loom demo recording
- **ContentFlow model note:** replace `minimax/minimax-m2.1` with Gemini Flash Lite when fixing v2

## AI Stack
- OpenRouter for all AI calls
- Models: Gemini Flash (scanning), Claude Opus (confirmation)
- Supabase for auth + usage tracking (prod only)

## WSL Machine (Brainy — separate Windows machine)
- Brainy/OpenClaw at ~/.openclaw/
- Paper trades DB: ~/.openclaw/trading/paper_trades_v2.db
- Polymarket pipeline v2: cron every 2h, paper trading mode
- Agents: Trading Scout, ContentFlow (!content), Felix (!felix)
- Env vars in ~/.bashrc and ~/.env
