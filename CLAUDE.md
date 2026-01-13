# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Rules

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.

2. The plan should have a list of todo items that you can check off as you complete them.

3. Before you begin working, check in with me and I will verify the plan.

4. Then, begin working on the todo items, marking them as complete as you go.

5. Please every step of the way just give me a high level explanation of what changes you made.

6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.

7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY.

9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npx prisma generate   # Regenerate Prisma client after schema changes
npx prisma db push    # Push schema changes to database
```

## Architecture

This is a Next.js 16 App Router application for transcribing media from various platforms.

### Supported Platforms
- **YouTube** - Videos, Shorts, live streams
- **TikTok** - Videos
- **Instagram** - Reels, videos
- **X/Twitter** - Video tweets
- **Threads** - Video posts
- **Bluesky** - Video posts
- **Facebook** - Videos, Reels
- **Vimeo** - Videos
- **Twitch** - Clips, VODs
- **Reddit** - Video posts
- **LinkedIn** - Video posts
- **Snapchat** - Stories, Spotlight
- **Rumble** - Videos
- **Dailymotion** - Videos
- **Podcasts** - RSS feeds, Spotify, Apple Podcasts, etc.

### Database
- Prisma ORM with SQLite via libsql adapter
- Prisma client generated to `src/generated/prisma/`
- Models: `User` and `Transcript`

### Authentication
- NextAuth v4 with credentials provider (email/password)
- JWT session strategy
- Auth config in `src/lib/auth.ts`
- Custom login page at `/auth/login`

### Transcription Pipeline (`src/services/`)

The `transcriptProcessor.ts` orchestrates the transcription flow:

1. `urlParser.ts` - Detects platform from URL (15+ platforms supported)
2. **Caption Fetching** (FREE - used first):
   - `youtube.ts` - YouTube captions via youtube-transcript npm
   - `captions.ts` - Universal caption extraction via yt-dlp for TikTok, Instagram, Facebook, etc.
3. **Whisper Transcription** (PAID - fallback):
   - `mediaDownloader.ts` - Downloads audio via yt-dlp
   - `transcription.ts` - OpenAI Whisper API for audio-to-text
4. `podcast.ts` - Parses RSS feeds, extracts audio URL

**Cost Optimization**: The pipeline tries to fetch existing captions (free) before falling back to Whisper ($0.006/min).

### API Routes (`src/app/api/`)
- `auth/[...nextauth]` - NextAuth handlers
- `auth/register` - User registration
- `transcript/create` - Create new transcript from URL
- `transcript/[id]` - Get/delete single transcript
- `transcript/[id]/ai` - AI summary and content generation
- `transcript/list` - List user's transcripts

### AI Services (`src/services/ai.ts`)
- Uses **GPT-4.1-mini** (as of Jan 2026 - best balance of performance/cost)
- `generateSummary()` - Summary, key points, topics
- `generateContent()` - Blog post, Twitter thread, LinkedIn post, show notes
- `generateCustomContent()` - Custom prompts against transcript

### Components (`src/components/`)
- `TranscriptViewer.tsx` - Main viewer with all features:
  - Copy (with/without timestamps)
  - Export (TXT, SRT, VTT, PDF)
  - Timestamp toggle display
  - Search with highlighting
  - Edit mode
  - AI Summary & Content tabs
- `URLForm.tsx` - URL input with platform auto-detection
- `Navbar.tsx` - Navigation with auth state

### Environment Variables
Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth encryption key
- `OPENAI_API_KEY` - For Whisper transcription and GPT-4.1-mini

Optional (for production rate limiting):
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token

Note: Without Redis, rate limiting falls back to in-memory (works for dev, not for serverless)

### External Dependencies
- **yt-dlp** - Required for media download (`pip install yt-dlp`)
- **ffmpeg** - Optional (for mp3 conversion, works without using m4a)

### Key Files
| File | Purpose |
|------|---------|
| `urlParser.ts` | Platform detection from URLs (15+ platforms) |
| `captions.ts` | Universal caption fetching via yt-dlp subtitles |
| `mediaDownloader.ts` | Audio download via yt-dlp |
| `transcription.ts` | OpenAI Whisper transcription |
| `ai.ts` | GPT-4.1-mini for summaries & content generation |
| `transcriptProcessor.ts` | Orchestrates entire pipeline |
