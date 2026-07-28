# 06 — Development Phases

Ship the money loop first; add video (the expensive, slow feature) only after
the funnel converts. Each phase ends with something a real user can touch.

## Phase 0 — Foundations (Week 1)
- [x] Next.js 15 + TypeScript + Tailwind + shadcn/ui scaffold (Prisma 7 driver-adapter setup; shadcn tokens/`cn()` wired — add components with `npx shadcn add`)
- [x] Prisma schema + generated client (`npm run db:push` once `DATABASE_URL` points at a real Neon database)
- [x] Clerk auth middleware + `/api/webhooks/clerk` → `User` sync (fill Clerk keys in `.env`)
- [x] PostHog provider (no-ops until `NEXT_PUBLIC_POSTHOG_KEY` is set)
- [ ] **Account setup (human step):** create Neon, Clerk, Stripe (test mode), PostHog, and Resend accounts; copy keys into `.env` per `.env.example`; connect the repo to Vercel

## Phase 1 — Metric Model + Pro Roster (Weeks 1–2)
- [ ] Finalize the 12 metrics (`src/lib/metrics.ts`) — resist adding more
- [ ] Author 30–40 pro profiles covering the position × archetype grid
      (spreadsheet → seed script); write `styleSummary` + 3 `studyClips` each
- [ ] Implement + unit-test the matcher (`src/lib/matching.ts`)
- [ ] Tuning harness: ~50 synthetic athlete vectors, eyeball the matches,
      tune weights until zero embarrassing results

## Phase 2 — Questionnaire Funnel (Weeks 2–4) → **first end-to-end demo**
- [ ] 14-question quiz UI (one question/screen, position branching)
- [ ] Email capture between submit and reveal
- [ ] `/api/analyze/text` (Claude scoring → match → explanation)
- [ ] Reveal sequence + Study Dashboard (radar chart, why, study clips, gaps)
- [ ] Shareable match card (`@vercel/og` image generation)

## Phase 3 — Payments + First Programs (Weeks 4–6) → **first dollar**
- [ ] Author 3 flagship 8-week programs for your 3 most-matched pros
      (buy out a coach's time for content; you own the IP) — `PlanSession` rows
- [ ] Sales page with personalized gap section; Week 1 unlocked as preview
- [ ] Stripe Checkout + webhook fulfillment (`/api/stripe/webhook`) + order bump
- [ ] Program delivery UI: week/day navigator, session checklists, drill videos
- [ ] Abandoned-checkout emails; money-back guarantee flow

**→ LAUNCH here.** Questionnaire-only is a complete product. Validate
conversion before building video.

## Phase 4 — Video Analysis (Weeks 6–9)
- [ ] R2 presigned direct uploads (jersey color/number form)
- [ ] Inngest pipeline: ffmpeg sampling → frame-batch analysis → aggregation
      → hybrid merge with quiz metrics → re-match
- [ ] "Verified by film" badge on results; positioned as the accuracy upgrade
- [ ] Cost guardrails: 3-min cap, per-user analysis quota, static-frame pre-filter

## Phase 5 — Retention & Scale (Weeks 9–12)
- [ ] Week-4 re-assessment + progression view ("explosiveness +11")
- [ ] Membership tier ($12/mo): all programs + monthly re-tests
- [ ] Program coverage for the full roster (template sessions + per-pro
      emphasis blocks keep authoring cost sane)
- [ ] Match-quality feedback loop ("Does this feel like you?") → tuning data
- [ ] A/B: pricing, reveal copy, order-bump offer

## Deliberately Deferred
- Custom CV/pose models — the LLM pipeline is replaceable behind the metric
  contract if scale ever justifies it
- pgvector ANN search — pointless under ~1,000 pros
- Native mobile app — the web funnel converts from social traffic; wrap later
- Team/club licenses — strong Phase 6 revenue line once B2C proves the model
