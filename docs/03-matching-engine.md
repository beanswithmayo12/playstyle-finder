# 03 — The Matching Engine

Reference implementation: [`src/lib/matching.ts`](../src/lib/matching.ts).

## The Metric Model

Everything runs on a **canonical 12-metric vector**, 0–100 per metric
(`src/lib/metrics.ts`):

`verticalProgression · dribbleDensity · spatialCreation · finishingInstinct ·
passingRange · tempoControl · pressingIntensity · defensivePositioning ·
duelAggression · explosiveness · endurance · scanning`

Both extractors (questionnaire, video) output this shape; every pro profile is
authored in this shape. That makes the matcher a pure function — swap the AI
extractors freely without touching the math.

## Why weighted cosine + magnitude blend (not raw Euclidean, not embeddings)

**The core insight: playstyle is a *shape*, not a *level*.** A 16-year-old
playmaker produces every number at a lower absolute level than Kevin De Bruyne
— but the *profile* (high passing range, high spatial creation, low pressing,
low dribble density) has the same shape. So:

- **Raw Euclidean distance fails**: it would match every amateur to whichever
  pro has the most "average" numbers, because level gaps swamp style gaps.
- **Pure text embeddings fail differently**: embedding a prose description and
  doing vector search gives you *plausible* matches you can't explain. You
  need to show a radar chart and say "you match because X" — that demands an
  interpretable metric space, not a 1536-dim black box.
- **Weighted cosine similarity on standardized metrics** captures shape,
  weights the metrics that define the athlete's position, and remains fully
  explainable — every match decomposes into per-metric contributions.

## The Algorithm, Step by Step

### 1. Position gating (hard filter, softened at the edges)
Only pros in the athlete's position group or adjacent groups
(`ADJACENT_POSITIONS`) are candidates. A winger can match an attacking mid
(Musiala drifts wide) but never a center back. Adjacent-group pros carry a
small fixed penalty (−0.06) so they only win on a clearly better style fit.

### 2. Z-score standardization
Each metric is standardized across the candidate pool:

```
z_i = (x_i − μ_i) / σ_i
```

Without this, low-variance metrics (every pro has elite endurance) contribute
nothing and high-variance ones dominate. After standardization, "unusually
high dribble density *for this position*" is what registers — which is exactly
what playstyle means.

### 3. Weighted cosine similarity (the style term)

```
cos_w(a, b) = Σ wᵢ·aᵢ·bᵢ / (√(Σ wᵢ·aᵢ²) · √(Σ wᵢ·bᵢ²))
```

`w` comes from `POSITION_WEIGHTS`: for a winger, dribbleDensity and
explosiveness weigh 3×; for a DM, tempoControl and scanning do. The same
athlete vector produces different rankings depending on position — correct,
because what defines "similar style" is position-relative.

### 4. Magnitude blend (the intensity term)
A pure-shape match has a failure mode: a player who does everything gently
matching a player who does everything violently. A raw-value term fixes it:

```
mag(a, b) = 1 − Σ wᵢ·|aᵢ − bᵢ| / 100
similarity = 0.8 · rescale(cos_w) + 0.2 · mag
```

80/20 keeps shape dominant (amateurs *should* match pros despite the level
gap) while intensity breaks ties between shape-similar pros.

### 5. Output
The engine returns the top 3 with per-metric `deltas` (pro − athlete).
Rank 1 becomes the match; ranks 2–3 are stored as `runnersUp` (great content:
"You also share DNA with Pedri and Bernardo Silva"); `deltas` drive the
personalized sales pitch for the training plan.

## Roster Design Beats Roster Size

The matcher can only be as good as pro coverage. **30–40 pros chosen to cover
every position × archetype cell** beat 500 redundant stars:

| Position | Archetypes to cover (examples) |
|---|---|
| ST | Poacher (Haaland) · Complete (Kane) · False 9 (Firmino-type) · Target (Isak) |
| W | Explosive transitional (Vinícius) · Inverted creator (Kvaratskhelia) · Touchline classic (Saka) |
| AM | Low-tempo orchestrator (De Bruyne) · Dribbling interior (Musiala) · Shadow striker (Bellingham) |
| CM | Box-to-box (Valverde) · Tempo metronome (Kroos-type) · Presser (Reijnders) |
| DM | Destroyer (Casemiro) · Deep-lying builder (Rodri) |
| FB | Overlapping (Hakimi) · Inverted (Trent-type) · Defensive (Saliba-adjacent FBs) |
| CB | Ball-playing (van Dijk) · Aggressive stopper (Militão) |
| GK | Sweeper (Neuer-type) · Shot-stopper |

Every athlete must have a *satisfying* nearest neighbor. Audit this by
generating synthetic athlete vectors across the style space and checking that
no archetype cell produces embarrassing matches.

## Tuning Loop

1. Seed the roster, generate ~50 synthetic athlete profiles you can judge by
   eye ("this is obviously a Rodri-type").
2. Run the matcher; record mismatches.
3. Adjust `POSITION_WEIGHTS`, the 80/20 blend, and pro metric values — in that
   order. Pro metric authoring errors cause most bad matches.
4. Post-launch: log every match + add a one-tap "Does this feel like you?"
   rating. That feedback stream is your tuning dataset (and a testimonial farm).

## Scaling Note

At ≤ 1,000 pros this is an in-memory loop over Prisma rows — microseconds,
no infrastructure. If you later expand to thousands of pros (historical
players, women's game, regional leagues), enable `pgvector`, store the
standardized vectors, and use cosine ANN search with a position filter. The
public contract (`rankMatches`) doesn't change.
