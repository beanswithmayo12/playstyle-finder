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
- [x] Finalize the 12 metrics (`src/lib/metrics.ts`) — resist adding more
- [x] Author 36 pro profiles covering the position × archetype grid
      (`src/data/pros.ts`; seed with `npx prisma db seed`). Study clips use
      `youtubeQuery` search strings — swap in curated video ids editorially
- [x] Implement + unit-test the matcher (`npm test`, 12 tests) — tuning
      surfaced a real flaw (pool z-scoring washed out amateur style signal);
      switched to per-vector standardization / weighted Pearson correlation
- [x] Tuning harness (`npm run tune:matcher`): 36 synthetic amateurs,
      34/36 self-match at rank 1, 36/36 top-2, zero embarrassing rows

## Phase 2 — Questionnaire Funnel (Weeks 2–4) → **first end-to-end demo**
- [x] 14-screen quiz UI at `/quiz` (one question/screen, GK phrasing variants,
      sessionStorage persistence, config in `src/data/quiz.ts`)
- [x] Capture-at-peak-curiosity: `/quiz/reveal` gates the result behind Clerk
      sign-up ("create your free account to see your match"), then runs analysis
- [x] `/api/analyze/text` upserts user + profile from the quiz payload
      (no webhook dependency), scores via Claude, matches, explains
- [x] Reveal + Study Dashboard at `/dashboard`: radar comparison (recharts),
      scouting report, study-clip cards, runners-up, gap section → `/plans` CTA
- [x] Share loop: public share page `/m/[matchId]` + OG card `/api/og/[matchId]`
      (native share / clipboard from the dashboard)

## Phase 3 — Payments + First Programs (Weeks 4–6) → **first dollar**
- [x] 3 flagship 8-week programs (De Bruyne / Vinícius / Rodri): drill library
      (`src/data/drills.ts`, 36 drills) + program generator with phase-based
      progression (`src/data/programs.ts`) → 32 seeded sessions per program.
      Review/extend content with a licensed coach before scaling paid volume
- [x] `/plans` sales page: personalized gap bullets from `metricDeltas`,
      Week 1 fully visible as proof-of-quality, guarantee copy
- [x] Stripe Checkout + webhook fulfillment; `scripts/sync-stripe-prices.ts`
      auto-creates Products/Prices and replaces placeholder ids
      (order bump: configure in the Stripe Checkout dashboard)
- [x] `/program/[planId]` delivery UI: week navigator, session checklists with
      optimistic completion tracking (`SessionCompletion`), drill cues + video
      references, post-payment "unlocking" holding screen
- [ ] Abandoned-checkout emails via Resend (moved to Phase 5 email batch)

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
