# 01 — Tech Stack Architecture

Optimized for a **solo developer / small team**: one deployable app, managed
services everywhere, no infrastructure to babysit, and a video pipeline that
costs pennies per analysis instead of dollars.

## Stack Choices & Rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router, TypeScript)** | One codebase for marketing site, app, and API. Server Components keep the dashboard fast; API routes handle webhooks and AI calls server-side (never expose API keys to the client). |
| UI | **Tailwind CSS + shadcn/ui** | Fast to build a premium-feeling dashboard. Radar charts via `recharts`. |
| Hosting | **Vercel** | Zero-ops deploys, edge caching for the marketing funnel, preview deploys per branch. |
| Database | **PostgreSQL on Neon + Prisma ORM** | Relational data (users → purchases → plans) fits SQL. Neon's serverless driver works on Vercel. Prisma gives type-safe queries and migrations. Enable `pgvector` later if the pro roster grows past a few thousand. |
| Auth | **Clerk** | Drop-in auth with social login. Athletes are Gen-Z — "Continue with Google/Apple" matters for conversion. Webhook syncs users into your `User` table. |
| AI (text) | **Claude `claude-sonnet-5`** | Parses the questionnaire into structured metrics and writes the match explanation. Structured output via tool-use guarantees valid JSON. |
| AI (video) | **Claude multimodal over sampled frames** | See the video pipeline below. No custom computer-vision models, no GPU bills. |
| Background jobs | **Inngest** | Video analysis takes 30–90s — too long for a request cycle. Inngest gives durable, retryable steps with zero queue infrastructure, and works natively with Next.js. |
| File storage | **Cloudflare R2** (S3-compatible) | Free egress (critical for video), presigned direct uploads so video bytes never touch your server. |
| Payments | **Stripe Checkout + Customer Portal** | Hosted checkout = PCI compliance solved, Apple Pay/Google Pay for mobile conversion. Webhooks drive fulfillment. |
| Email | **Resend + React Email** | Transactional (match result, receipt) and the abandoned-checkout sequence. |
| Analytics | **PostHog** | Funnel analysis (input → result → checkout → paid) and A/B tests on pricing/copy. |

## System Diagram

```
                        ┌─────────────────────────────────────────────┐
                        │                 Next.js on Vercel           │
  Athlete ──────────────►  Marketing pages │ Questionnaire │ Dashboard │
     │                  │  API routes: /api/analyze, /api/stripe/*    │
     │ direct upload    └───────┬──────────────────┬──────────────────┘
     │ (presigned URL)          │                  │
     ▼                          ▼                  ▼
 Cloudflare R2 ◄──────── Inngest job ────────► Claude API
 (raw video)             1. ffmpeg sample      (frame analysis,
                         2. LLM score frames    questionnaire parsing,
                         3. aggregate metrics   match explanation)
                         4. run matcher
                                │
                                ▼
                     Neon PostgreSQL (Prisma)
              users · assessments · pro_players · matches
              training_plans · purchases
                                ▲
                                │ webhook (checkout.session.completed)
                             Stripe
```

## The Video Pipeline (Cost-Effective by Design)

**Principle: never run continuous video through an AI model.** A highlight
reel is ~90% dead time between actions. You extract a sparse set of frames and
short action bursts, and let a multimodal LLM read those.

### Steps

1. **Client-side guardrails.** Cap uploads at 3 minutes / 250 MB. Ask the user
   to upload a *highlight reel*, not full match tape — better signal AND
   cheaper. Request the athlete's jersey color + number in the upload form so
   the model knows who to watch.

2. **Direct-to-R2 upload.** Your API route mints a presigned PUT URL; the
   browser uploads straight to R2. Your serverless functions never handle
   video bytes (they'd blow past body-size and execution limits anyway).

3. **Inngest job — sampling.** A lightweight worker (Inngest step running
   ffmpeg via a small Railway/Fly container, or Vercel's larger functions with
   `ffmpeg-static`) does:
   ```bash
   # Downscale + sample 1 frame every 2 seconds
   ffmpeg -i input.mp4 -vf "fps=1/2,scale=768:-1" -q:v 4 frames/f_%03d.jpg
   ```
   A 3-minute reel → ~90 frames at 768px ≈ well under typical vision-token
   budgets when batched 20–30 frames per request.

4. **Inngest job — LLM scoring.** Send frame batches (with timestamps and the
   jersey identifier) to Claude with the video-analysis system prompt
   (`docs/04-ai-prompts.md`). Each batch returns *observed events*
   (dribble past defender, line-breaking pass, pressing action, etc.).

5. **Aggregation.** A final LLM call (or plain code) converts the event log
   into the canonical 12-metric vector, with a `confidence` per metric —
   frames can't measure everything (e.g., scanning frequency), so low-confidence
   metrics fall back to questionnaire answers when both inputs exist.

6. **Matching + persistence.** Run the matcher (`src/lib/matching.ts`), store
   the `Assessment` + `MatchResult`, email the athlete "Your match is ready."

### Cost Envelope (per video analysis)

| Item | Approx. cost |
|---|---|
| R2 storage (250 MB, 30-day retention) | ~$0.004 |
| ffmpeg compute (30s on a small container) | ~$0.001 |
| ~90 frames through Claude vision + aggregation | ~$0.05–0.15 |
| **Total** | **≈ $0.05–0.15** |

That's cheap enough to give away free — which is exactly the funnel strategy
(see `docs/05-monetization-ux.md`). If volume explodes, add a cheap pre-filter
(frame-difference detection to drop static frames) before the LLM.

### Why not "real" computer vision (pose estimation, tracking models)?

You could run YOLO + ByteTrack + pitch homography to compute true event data —
that's what pro clubs do. For a solo dev it's the wrong trade: weeks of
engineering, GPU hosting, and brittle results on shaky phone footage. The
multimodal-LLM approach ships in days, degrades gracefully, and the output
feeds the same metric model — so you can swap in proper CV later without
touching anything downstream. **The metric vector is the contract; the
extractor behind it is replaceable.**

## Environment Variables

```
DATABASE_URL=            # Neon pooled connection string
ANTHROPIC_API_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
R2_ACCOUNT_ID= / R2_ACCESS_KEY_ID= / R2_SECRET_ACCESS_KEY= / R2_BUCKET=
STRIPE_SECRET_KEY= / STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
INNGEST_EVENT_KEY= / INNGEST_SIGNING_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
```
