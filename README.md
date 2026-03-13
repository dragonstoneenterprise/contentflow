# ContentFlow

Transform YouTube transcripts into blog posts, Twitter threads, and YouTube Shorts scripts with AI.

## Features

- **YouTube Transcript Fetching** - Paste a YouTube URL to auto-fetch the transcript
- **AI Content Generation** - Transform one transcript into:
  - Blog post (400-600 words, SEO optimized)
  - Twitter thread (5 engaging tweets)
  - YouTube Shorts script (60-second format)
- **Free Tier** - 3 generations per day
- **Pro Tier** - Unlimited generations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your OpenRouter API key to `.env.local`:
```
OPENROUTER_API_KEY=your_key_here
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
npm run build
# Upload dist/ folder to Vercel
```

## Pricing

- **Free**: 3 generations/day
- **Pro**: $19/month unlimited via [Gumroad](https://9245368029329.gumroad.com/l/tnlfjv)

## Tech Stack

- Next.js 14
- Tailwind CSS
- TypeScript
- OpenRouter API (MiniMax)
- YouTube Transcript API

## Cost

- Hosting: Free (Vercel)
- AI: ~$0.001 per generation (very cheap!)
- Your $10 OpenRouter credit = ~10,000 generations