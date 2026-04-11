# Snipflow — Claude Code Context

## Project
- Product: Snipflow — AI content repurposing tool
- Live URL: https://snipflow.vercel.app
- GitHub: https://github.com/dragonstoneenterprise/contentflow
- Vercel project: snipflow (havns-projects-fdefe05a)

## Stack
- Next.js 14, TypeScript, Tailwind CSS
- Supabase for auth and database
- OpenRouter for AI (Gemini Flash)
- Gumroad for payments: https://9245368029329.gumroad.com/l/tnlfjv

## Rules
- Always work in /Users/wilsonhuang/Desktop/Claude Code Projects /contentflow
- Never work in worktrees
- Always run npm run build before pushing
- Always push to main branch
- Payment system is Gumroad only — never Stripe
- Pricing: $19/month, 18 founder spots

## Key Files
- app/page.tsx — main landing page
- app/affiliates/page.tsx — affiliate program page
- app/api/generate/route.ts — content generation API
- app/api/extract-ideas/route.ts — idea extractor API
