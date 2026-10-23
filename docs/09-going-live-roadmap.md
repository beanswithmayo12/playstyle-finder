# 09 — Going Live: From Demo to Real

Everything works end to end today, but a lot of what a player sees is demo or
placeholder data. This is the plan to replace every fake piece with the real
thing and launch. It's in order: each phase builds on the one before, and
each ends with something you can test yourself.

## What's fake right now

| What the player sees | Where it comes from today | What makes it real | Phase |
|---|---|---|---|
| Quiz ratings, scout's notes, match explanation | Demo AI mode (`MOCK_AI=1`): keyword rules and template text | A real Anthropic API key | 1 |
| Film key moments and stats | Demo mode: the same 8 canned events for every reel | Real AI frame analysis | 1–2 |
| "Where you play" heat map | Estimated from position, foot and ratings | The AI tags where on the pitch each action happens | 2 |
| Pro ratings (all 36 pros) and the pro OVRs | Hand-typed estimates in `src/data/pros.ts` | Numbers computed from real match stats | 3 |
| Which side wingers and fullbacks play on | Hand-entered for 10 pros (`src/data/pro-sides.ts`) | The same stats source as the ratings | 3 |
| Study clips | YouTube *search* links | Curated, specific videos | 3 |
| Training programs and drills | Written by us, not yet reviewed | A qualified coach reviews them | 3 |
| Program prices / checkout | Stripe test mode, `placeholder_` prices | Stripe live mode | 4 |
| Highlight reel storage | Saved on your laptop | Cloud storage (Cloudflare R2) | 2 |

Things that are fake **on purpose** stay that way: the blurred sample report on
the sign-up screen and the homepage sample report are labeled as samples.

---

## Phase 1 — Turn on the real AI (about 1 week)

**Goal:** a stranger takes the quiz and gets a real, sensible scouting report.

1. **Get an API key** at console.anthropic.com, add a payment method, and
   **set a monthly spend limit** in the console (start small, e.g. $20) so a
   bug can never run up a bill.
2. **Turn off demo mode:** put the key in `.env` as `ANTHROPIC_API_KEY` and
   remove `MOCK_AI`.
3. ✅ **Put the model name in one place.** Done: `src/lib/ai/client.ts`, and
   `ANTHROPIC_MODEL` in `.env` switches models without touching code. Check
   your key with `npm run ai:check`.
4. **Run the quiz 15–20 times** with deliberately different answers (a
   dribbler, a holding midfielder, a target striker, a goalkeeper). Check:
   do the ratings fit the answers? Do the matches make sense? Does the
   explanation read like a scout wrote it?
5. ✅ **Log what each call costs.** Done: every AI call prints a line like
   `[ai] quiz scoring · claude-sonnet-5 · 2140 in / 610 out · ≈$0.0104` in
   the `npm run dev` terminal. Add those up per quiz and per reel.

**Which AI model?** This is your call. The options at today's prices (per
million tokens, input / output):

| Model | Price | Notes |
|---|---|---|
| Claude Sonnet 5 (what the code uses now) | $2 / $10 | Works today with no code changes |
| Claude Sonnet 5.5 | $2 / $10 | Newer, same price. Needs a small code change first: the app forces a specific tool call, and 5.5 doesn't allow that, so we'd switch to structured outputs |
| Claude Opus 5.5 | $4 / $20 | Most capable; worth testing on film, where accuracy matters most |
| Claude Haiku 5.5 | $0.10 / $0.50 | About 20× cheaper; only worth it if it passes the accuracy test in Phase 2 |

My suggestion: launch Phase 1 on Sonnet 5 as-is, then let the Phase 2
accuracy test decide the film model.

**Rough cost** (estimates; step 5 replaces these with real numbers):
- One quiz report: a few cents.
- One full 3-minute reel: about $0.20–0.40 on Sonnet. A reel sends up to 100
  frames (one every 2 seconds), and each frame is roughly 400–450 tokens.
- The app already caps each player at **3 reel analyses per month**, so AI
  cost per player is bounded at roughly $1/month worst case.

**Done when:** 20 real quiz runs give matches you'd defend to a coach.

---

## Phase 2 — Make film analysis real and trustworthy (2–4 weeks)

**Goal:** the AI reliably finds the player in their reel and tags what they
did, and we can *prove* it with numbers.

1. **Cloud storage:** create the Cloudflare R2 bucket (private). It needs a
   card on file, but the free tier (10 GB) covers early use. Add the keys,
   and the app switches from laptop storage automatically.
2. **Background jobs in the cloud:** create an Inngest account and add its
   keys, replacing the local `INNGEST_DEV` setup.
3. **Check where the video work runs.** Analyzing a reel (cutting frames with
   ffmpeg, then several AI calls) can take minutes. Hosting platforms limit
   how long one request may run, so test a full 3-minute reel once deployed.
   If it gets cut off, move video processing to a small separate worker
   service.
4. **Build a test set. This is the most important step.** Collect 20–30 real
   highlight reels (yours, teammates', friends', with their permission) and
   hand-label them: every action's time, type (take-on, shot, pass...),
   whether it worked, and roughly where on the pitch. Then run the AI on
   them and score it:
   - Did it find the right player? (jersey color + number)
   - What share of the real actions did it catch?
   - How many actions did it invent?

   This tells us whether the film feature is ready, and which model to use.
   Run the same set on 2–3 models and compare accuracy against cost.
5. **Fix what the test set exposes.** Likely candidates:
   - "Find me": let the player tap themselves on a still from their reel
     before analysis, instead of relying only on jersey color and number.
   - Clearer feedback when footage is too far away, shaky, or broadcast-style.
6. **Real heat maps:** have the AI also report *where* each action happened
   (a position on the pitch), then build the heat map from those points.
   Quiz-only players keep the estimated map, still labeled as an estimate.

**Done when:** on the test set, the AI finds the right player and catches
most actions without inventing many. We'll set the exact bar once we see the
first scores.

---

## Phase 3 — Real pro data (can run alongside Phase 2)

**Goal:** every number about a pro traces back to real match data.

1. **Pick a data source** for pro stats per 90 minutes (take-ons, progressive
   carries, pressures, shots...). Options range from licensed providers
   (Opta, StatsBomb, Wyscout) to open datasets. **Check each source's license
   before using it in a paid product.** Many free stats sites don't allow
   scraping or commercial use.
2. **Compute the 12 metrics from the stats.** For example, Dribbling becomes
   the pro's take-on rate ranked against other players in their position.
   Write it as a script, so the numbers can be refreshed each season instead
   of re-typed.
3. **Side of the pitch** for every wide player, from the same data.
4. **Re-run the matcher tests and tuning** (`npm test`, `npm run tune:matcher`)
   against the new pro numbers.
5. **Curate study clips:** swap the YouTube search links for specific videos
   that show each habit.
6. **Coach review:** have a qualified coach (and ideally a strength and
   conditioning coach, since many users will be teenagers) review the 8-week
   programs and team-practice habits. Their review also gives you credibility
   to market with.

**Done when:** no pro number is hand-typed, and a coach has signed off on the
programs.

---

## Phase 4 — Launch (1–2 weeks)

**Goal:** the site is live on a real domain and can take real payments.

1. **Accounts** (most have free tiers to start):
   - Vercel (hosting) + a domain
   - Neon (database)
   - Clerk production instance (sign-in on your domain)
   - Stripe live mode: run `scripts/sync-stripe-prices.ts` to replace the
     `placeholder_` prices, and point the webhook at the live site
   - PostHog (analytics) and Resend (email)
2. **Phone layout.** You put this off during the redesign, but it can't wait
   past launch: the plan is to find players through TikTok, Instagram and
   YouTube Shorts, so most visitors will arrive on a phone.
3. **Legal basics** (worth a short consult with a lawyer before taking money):
   - A privacy policy and terms of service.
   - **Age policy.** Many users will be minors. In the US, collecting data
     from children under 13 needs verified parental consent (COPPA). The
     simplest launch rule is 13+ only, with parent accounts added later.
   - Consent for footage: reels show other players too.
   - A way to delete your account and your videos.
   - Keep the existing "AI estimate, not an official evaluation" wording, and
     don't imply that any pro endorses the app.
4. **Spending guardrails:** keep the Anthropic spend limit, add billing
   alerts on every service, and keep the 3-reels-per-month cap.

**Done when:** a friend on their phone can sign up, upload a reel, get a
real report, and buy a program with a real card.

---

## Phase 5 — Prove it with real players (ongoing)

1. **Private beta with 20–50 players** (a club team or two is ideal).
   Add a quick "Does this match feel right?" thumbs up / down on the report.
2. **Watch the funnel in PostHog:** visit → upload or quiz → report →
   program page → purchase. Fix the biggest drop first.
3. **Tune from feedback:** use the thumbs-down reports to adjust matcher weights and
   prompts, and re-check them against the Phase 2 test set every time.
4. **With permission, keep labeled film.** Real, consented reels with
   corrections are exactly what a custom model would need later.

## Phase 6 — Later: your own model

Training a custom video model only makes sense once there are thousands of
labeled reels from Phase 5, and once AI cost or accuracy actually limits the
business. Until then, the general AI plus your matching engine is faster and
cheaper.

---

## Decisions that are yours to make

1. **Which model** for quiz reports and for film (Phase 1 / Phase 2 test).
2. **Pro data source and budget**: paid license or open data (Phase 3).
3. **Age policy at launch**: 13+ only, or parent accounts (Phase 4).
4. **Who reviews the training programs** (Phase 3).
5. **Where video processing runs** if the hosting test in Phase 2 fails.
