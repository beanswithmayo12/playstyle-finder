# Playstyle Finder ⚽

**Match your game to a pro. Train like them.**

A SaaS web app for soccer athletes that analyzes their playstyle (via a deep
questionnaire or uploaded highlight video), matches them to a professional
player profile using an AI scoring + similarity engine, and sells targeted
8-week training programs designed around that pro's athletic and tactical
profile.

## The Loop

```
Free Analysis  →  "You match Kevin De Bruyne"  →  Study Dashboard  →  Paid 8-Week Plan
(questionnaire      (AI matching engine)          (tactical "why" +     (Stripe checkout,
 or video)                                         curated footage)      pro-specific program)
```

## Blueprint Documents

| Doc | Contents |
|---|---|
| [docs/01-architecture.md](docs/01-architecture.md) | Full tech stack, system diagram, cost-effective video pipeline |
| [docs/02-database-schema.md](docs/02-database-schema.md) | Schema design rationale (the actual schema lives in `prisma/schema.prisma`) |
| [docs/03-matching-engine.md](docs/03-matching-engine.md) | The math: metric model, normalization, weighted similarity, position gating |
| [docs/04-ai-prompts.md](docs/04-ai-prompts.md) | Exact system prompts for questionnaire parsing, video analysis, and match explanations |
| [docs/05-monetization-ux.md](docs/05-monetization-ux.md) | Conversion funnel, pricing, checkout page wireframe |
| [docs/06-roadmap.md](docs/06-roadmap.md) | Step-by-step development phases (MVP → scale) |

## Starter Code

| File | Contents |
|---|---|
| `prisma/schema.prisma` | Complete PostgreSQL schema (Users, Profiles, ProPlayers, Assessments, Matches, TrainingPlans, Purchases) |
| `src/lib/metrics.ts` | The canonical 12-metric playstyle model shared by every layer |
| `src/lib/matching.ts` | The matching engine — normalization, weighted cosine similarity, position gating |
| `src/lib/prompts.ts` | Production-ready system prompts as importable constants |
| `src/app/api/analyze/text/route.ts` | Reference API route: questionnaire → Claude → metrics → match |
| `src/app/api/stripe/webhook/route.ts` | Reference Stripe webhook handler with idempotency |

## Recommended Stack (TL;DR)

- **Frontend + Backend:** Next.js 15 (App Router, TypeScript), Tailwind + shadcn/ui, deployed on Vercel
- **Database:** PostgreSQL (Neon) + Prisma, with `pgvector` ready for scale
- **Auth:** Clerk
- **AI:** Claude (`claude-sonnet-5`) for questionnaire parsing, video-frame analysis, and match explanations
- **Video:** Direct-to-R2 presigned uploads → ffmpeg frame sampling → multimodal LLM (no custom CV models)
- **Jobs:** Inngest for async video processing
- **Payments:** Stripe Checkout + webhooks (one-time plan purchase + optional membership)

See [docs/01-architecture.md](docs/01-architecture.md) for the reasoning behind each choice.
