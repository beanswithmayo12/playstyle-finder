# 05 — Monetization & UX Strategy

## The Funnel

```
TikTok/IG/YouTube Shorts ─► Landing page ─► Free analysis ─► Email capture
                                                                  │
        Paid plan ◄─ Checkout ◄─ Locked plan preview ◄─ Match reveal + dashboard
            │
        8-week program (retention → progression re-test → next plan / membership)
```

### Stage 1 — Acquisition: the match IS the marketing
The shareable result card ("I'm 87% Kevin De Bruyne ⚽") is the growth engine.
Every result page has a **Share Your Match Card** button generating a branded
image (pro comparison + radar chart + match %) sized for IG stories. This is
the same mechanic that made 16Personalities and Spotify Wrapped viral.
Content strategy: short-form videos of "what your match says about your game."

### Stage 2 — The free analysis (activation)
- **Questionnaire first, video optional.** The quiz takes 3 minutes and works
  for 100% of visitors; video upload is offered as an *upgrade to accuracy*
  after the quiz ("Add game film for a verified match"). Never make video the
  entry barrier.
- Quiz UX: one question per screen, progress bar, position-aware branching,
  ~14 questions. Free-text boxes for strengths/weaknesses (the LLM feasts on
  these).
- **Email capture happens between analysis and reveal**: "Your analysis is
  running — where should we send your pro match?" Capture-at-peak-curiosity
  converts far better than a signup wall at the door.

### Stage 3 — The reveal (the dopamine moment)
Full-screen reveal sequence: radar chart animates → pro's silhouette fades in
→ "You are a creative, low-tempo playmaker. **Your match: Kevin De Bruyne**"
→ match %. Then scroll into the Study Dashboard:

1. Side-by-side radar chart (athlete vs. pro)
2. The tactical "why" (AI explanation)
3. Curated study footage (`ProPlayer.studyClips` with focus prompts)
4. Runners-up strip ("You also share DNA with…")
5. **The gap section** → this is the bridge to money

### Stage 4 — The upsell: sell the gap, not the plan
The dashboard's gap section reads directly from `MatchResult.metricDeltas`:

> **Your development gaps vs. De Bruyne**
> Explosiveness ▓▓▓▓▓▓░░░░ −23 · Scanning ▓▓▓▓▓▓▓░░░ −18 · Passing range ▓▓▓▓▓▓▓▓░░ −9
>
> The De Bruyne Blueprint closes these exact gaps in 8 weeks. → **See the program**

The sales page shows Week 1 fully unlocked (real drills, real value —
proof-of-quality) and weeks 2–8 blurred with titles visible.

### Pricing

| Offer | Price | Notes |
|---|---|---|
| **Core: 8-week pro program** | **$49 one-time** | Anchor product. One-time beats subscription for trust with young athletes (and their parents' cards). |
| Order bump at checkout | +$19 | "Add the Nutrition & Recovery Protocol" — classic 30–40% take-rate bump. |
| Membership (post-purchase) | $12/mo | Unlocks all pro programs + monthly re-assessment + progression tracking. Upsell AFTER the first program purchase, at week 4 ("your re-test is ready"). |

Launch pricing test: A/B $39 vs. $49 vs. $59. Include a 14-day money-back
guarantee — it measurably lifts conversion and refund rates for digital
fitness products stay low.

### Stage 5 — Retention loop
Week-by-week program emails → week 4 mid-program re-assessment ("your
explosiveness is up 11 points") → week 8 completion + new match run →
"You've evolved: your game now trends toward Bellingham. Unlock his program."
Progression is the subscription pitch.

## Checkout Page Wireframe

Single page, no multi-step. Mobile-first (most traffic is IG/TikTok).

```
┌─────────────────────────────────────────────────────────┐
│  [logo]                              🔒 Secure checkout │
├───────────────────────────────┬─────────────────────────┤
│  LEFT (order summary)         │  RIGHT (payment)        │
│                               │                         │
│  [Pro's photo + your radar]   │  Stripe Checkout embed  │
│  The De Bruyne Blueprint      │  (or hosted redirect)   │
│  8-Week Playmaker Program     │   Apple Pay / G Pay     │
│                               │   on top — one-tap      │
│  ✓ 56 sessions, 8 weeks       │   matters on mobile     │
│  ✓ Closes YOUR 3 gaps:        │                         │
│    explosiveness, scanning,   │  [Pay $49 →]            │
│    passing range              │                         │
│  ✓ Video demo for every drill │  14-day money-back      │
│  ✓ Lifetime access            │  guarantee ✓            │
│                               │                         │
│  ┌───────────────────────┐    │  "My son trains with    │
│  │ ☐ ORDER BUMP  +$19    │    │   purpose now" ★★★★★    │
│  │ Nutrition & Recovery  │    │   — parent testimonial  │
│  │ Protocol              │    │                         │
│  └───────────────────────┘    │                         │
│  $49  ~~$79~~  Launch price   │                         │
└───────────────────────────────┴─────────────────────────┘
   (mobile: summary collapses to a sticky top bar with
    price + pro name; payment fills the screen)
```

Conversion details that matter:
- **Personalized bullet #2** — inject the athlete's actual gap metrics into
  the order summary. This is your unfair advantage over generic programs.
- Keep the pro's image and the athlete's radar chart visible at checkout —
  identity is the purchase driver.
- Testimonial from a **parent**, not just athletes — parents hold the card.
- Abandoned checkout: Resend sequence at +1h ("Your De Bruyne program is
  waiting") and +24h (guarantee reminder). Stripe gives you the events.

## Metrics to Watch (PostHog)

| Funnel step | Healthy target |
|---|---|
| Landing → quiz start | > 35% |
| Quiz start → complete | > 70% |
| Complete → email capture | > 80% |
| Reveal → checkout view | > 25% |
| Checkout view → paid | > 8% (with Apple Pay) |
| Share-card usage | > 15% of reveals — this is your CAC subsidy |
