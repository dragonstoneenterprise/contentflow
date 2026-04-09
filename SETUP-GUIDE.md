# Snipflow + Supabase Auth — Setup Guide

## Files Overview

Place these files in your Next.js project:

```
your-project/
├── middleware.ts                          ← middleware.ts
├── lib/
│   ├── usage.ts                          ← usage.ts
│   └── supabase/
│       ├── client.ts                     ← supabase-client.ts
│       └── server.ts                     ← supabase-server.ts
├── app/
│   ├── page.tsx                          ← page.tsx (see note below)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                  ← auth-callback-route.ts
│   └── api/
│       ├── generate/
│       │   └── route.ts                  ← api-generate-route.ts
│       └── extract-ideas/
│           └── route.ts                  ← api-extract-ideas-route.ts
```

**NOTE:** The page.tsx with Supabase auth is too large for a single output file.
Copy it from the Claude conversation or ask me to regenerate it.

---

## Step 1: Create Supabase Project (2 min)

1. Go to https://supabase.com → "Start your project" (free)
2. Create a new project, pick a region close to your users
3. Save the project URL and anon key from Settings → API

## Step 2: Run the SQL Setup

1. In Supabase dashboard → SQL Editor → New Query
2. Paste the contents of `supabase-setup.sql`
3. Click "Run" — this creates:
   - `profiles` table (stores plan, usage per user)
   - Auto-profile creation trigger on signup
   - Row Level Security policies
   - Daily usage reset logic

## Step 3: Enable Google OAuth

1. Supabase dashboard → Authentication → Providers → Google
2. Toggle ON
3. You need a Google OAuth client:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Authorized redirect URI: `https://<YOUR-SUPABASE-PROJECT>.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret into Supabase

## Step 4: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Step 5: Environment Variables

Add to Railway (or `.env.local` for dev):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# OpenRouter (your key — stays server-side, never exposed)
OPENROUTER_API_KEY=sk-or-v1-xxxx

# Models (change anytime without redeploying)
GENERATE_MODEL=google/gemini-flash-1.5
IDEA_EXTRACTOR_MODEL=google/gemini-flash-1.5

# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=https://contentflow-production-0aff.up.railway.app
```

## Step 6: Deploy

```bash
git add .
git commit -m "Add Supabase auth + Idea Extractor"
git push
```

Railway auto-deploys on push.

---

## How It Works

- User hits "Generate" or "Extract" → if not logged in, auth modal appears
- Google OAuth (one click) or email/password signup
- On signup, trigger auto-creates a `profiles` row: plan=free, daily_usage=0
- Every API call checks auth + increments usage server-side
- Free plan: 3/day (resets at midnight UTC)
- Pro plan: unlimited
- OpenRouter key is ONLY on the server — never sent to browser
- VPN/incognito doesn't help because usage is tied to authenticated user account

## Upgrading Users to Pro

For now (Gumroad), manually update in Supabase:
```sql
UPDATE profiles SET plan = 'pro' WHERE email = 'user@email.com';
```

Later: integrate Stripe webhooks to automate this.

## Cost Control

- `GENERATE_MODEL` and `IDEA_EXTRACTOR_MODEL` env vars let you switch models instantly
- Start with `google/gemini-flash-1.5` (free on OpenRouter)
- Upgrade to `deepseek/deepseek-chat` ($0.14/M) or `anthropic/claude-3.5-haiku` when revenue comes in
- Monitor usage in Supabase: `SELECT email, total_usage, plan FROM profiles ORDER BY total_usage DESC`
