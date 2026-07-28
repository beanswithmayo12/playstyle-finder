# 02 — Database Schema

The full schema lives in [`prisma/schema.prisma`](../prisma/schema.prisma).
This doc explains the design decisions that matter.

## Entity Map

```
User ──1:1── AthleteProfile
  │
  ├──1:N── Assessment ──1:1── MatchResult ──N:1── ProPlayer
  │            (metrics Json)                        │
  │                                                  ├──1:N── TrainingPlan ──1:N── PlanSession
  ├──1:N── Purchase ──1:N── PlanAccess ──N:1─────────┘
  └──1:N── PlanAccess

StripeEvent (idempotency ledger, standalone)
```

## Key Decisions

### 1. Metric vectors as `Json`, validated in code
The 12-metric vector (`src/lib/metrics.ts`) is stored as `Json` on both
`Assessment.metrics` and `ProPlayer.metrics`. Reasons:

- The metric set will evolve during tuning; `Json` avoids a migration per tweak.
- Type safety lives in one place — `isCompleteVector()` guards every write.
- With ~100–500 pro players, matching is an in-memory loop (sub-millisecond).
  **Only if** the roster grows to thousands do you add a `vector(12)` pgvector
  column via raw SQL migration and use ANN search. Don't build that on day one.

### 2. Assessments are append-only
Re-taking the quiz or uploading new footage creates a **new** `Assessment`
row. This gives you:

- **Progression tracking** — "3 months ago you were 71% De Bruyne, now 84%."
  This is a killer retention email.
- **Reprocessing** — `rawAnswers`/`videoKey`/`modelInfo` are kept, so when you
  improve a prompt you can re-run old inputs and compare match quality.

### 3. `MatchResult.metricDeltas` powers the upsell
The per-metric gap between athlete and pro (e.g., `explosiveness: -23`) is
stored at match time. The sales page reads it directly: *"Your explosiveness
is 23 points behind Vinícius Jr. Weeks 1–3 of this program close that gap."*
The data model IS the personalization engine.

### 4. `PlanAccess` is separate from `Purchase`
Access grants are their own table so comps, promo codes, and future team
licenses don't require fake payment rows. A purchase *creates* a grant; a
grant doesn't require a purchase.

### 5. Stripe integrity rules
- `Purchase.stripeCheckoutSessionId` is unique — the webhook upserts by it.
- `StripeEvent` records every processed event id; the webhook handler inserts
  it first and skips events it has seen (Stripe retries webhooks, and you must
  not double-grant).
- Fulfillment happens **only** in the webhook, never on the success-page
  redirect (redirects can be spoofed or never happen).

### 6. `ProPlayer.active` instead of deletes
Retiring a pro (transfer, scandal, roster refresh) flips `active = false`.
Historical `MatchResult` rows keep their foreign key; new matches exclude
inactive pros.

## Seeding the Pro Roster

Author pro profiles as TypeScript objects checked by `isCompleteVector`, then
`prisma db seed`. Start with **30–40 pros covering every position group ×
archetype combination** (see `docs/03-matching-engine.md` on why coverage
beats roster size). Source the metric values from a blend of:

- Public event data summaries (FBref percentiles are ideal — they're already
  position-normalized 0–100 values you can map onto your metric keys)
- Your own soccer judgment for style metrics data doesn't capture (tempo
  control, scanning)

Keep a spreadsheet as the source of truth and regenerate the seed file from it.
