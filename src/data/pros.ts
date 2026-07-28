/**
 * The pro player roster — the matching engine's search space.
 *
 * Authoring rules (docs/03-matching-engine.md):
 *  - Metrics are 0–100 on the SAME scale as athletes (50 = average competitive
 *    amateur), so pros run high in absolute terms; what drives matching is the
 *    SPREAD between pros, which the matcher standardizes per metric.
 *  - Coverage beats size: every position group needs its archetypes filled so
 *    every athlete has a satisfying nearest neighbor.
 *  - studyClips use `youtubeQuery` (a search string) until real curated video
 *    ids are added editorially — never ship fabricated video ids.
 *
 * Clubs are a snapshot (2025/26 season) — refresh at roster review, and flip
 * `active: false` in the DB rather than deleting when retiring a player.
 */

import type { Foot, PositionGroup } from "@/generated/prisma/enums";
import type { MetricVector } from "@/lib/metrics";

export interface ProSeed {
  slug: string;
  fullName: string;
  knownAs: string;
  nationality: string;
  club: string;
  positionGroup: PositionGroup;
  preferredFoot: Foot;
  archetype: string;
  tagline: string;
  metrics: MetricVector;
  styleSummary: string;
  studyClips: { title: string; youtubeQuery: string; focusPoint: string }[];
}

/** Order: verticalProgression, dribbleDensity, spatialCreation, finishingInstinct,
 * passingRange, tempoControl, pressingIntensity, defensivePositioning,
 * duelAggression, explosiveness, endurance, scanning */
function m(
  vp: number, dd: number, sc: number, fi: number, pr: number, tc: number,
  pi: number, dp: number, da: number, ex: number, en: number, sn: number,
): MetricVector {
  return {
    verticalProgression: vp, dribbleDensity: dd, spatialCreation: sc,
    finishingInstinct: fi, passingRange: pr, tempoControl: tc,
    pressingIntensity: pi, defensivePositioning: dp, duelAggression: da,
    explosiveness: ex, endurance: en, scanning: sn,
  };
}

export const PROS: ProSeed[] = [
  // ─────────────────────────── Strikers ───────────────────────────
  {
    slug: "erling-haaland", fullName: "Erling Braut Haaland", knownAs: "Erling Haaland",
    nationality: "Norway", club: "Manchester City", positionGroup: "ST", preferredFoot: "LEFT",
    archetype: "Ruthless penalty-box predator", tagline: "First touch is a shot",
    metrics: m(80, 35, 75, 99, 40, 30, 65, 40, 85, 92, 75, 60),
    styleSummary:
      "Lives on the last defender's shoulder and attacks the box with violent, perfectly timed runs. Minimal touches, maximal end product — his whole game is engineered around arriving at the finish.",
    studyClips: [
      { title: "Box movement masterclass", youtubeQuery: "Haaland movement in the box analysis", focusPoint: "Watch the double-move: check away, then dart across the defender's blind side." },
      { title: "One-touch finishing", youtubeQuery: "Haaland first time finishes compilation", focusPoint: "Count his touches before each goal — usually one." },
    ],
  },
  {
    slug: "harry-kane", fullName: "Harry Edward Kane", knownAs: "Harry Kane",
    nationality: "England", club: "Bayern Munich", positionGroup: "ST", preferredFoot: "RIGHT",
    archetype: "Complete deep-dropping striker", tagline: "A 10 and a 9 in one body",
    metrics: m(75, 45, 80, 96, 88, 65, 55, 50, 70, 55, 70, 78),
    styleSummary:
      "Drops into midfield to spray long diagonals, then re-enters the box to finish the move he started. Elite in both phases — creator and closer.",
    studyClips: [
      { title: "Dropping deep to build", youtubeQuery: "Harry Kane dropping deep passing analysis", focusPoint: "Note when he leaves the front line — always as the ball moves to a settled build-up." },
      { title: "Two-touch finishing", youtubeQuery: "Harry Kane finishing compilation", focusPoint: "Watch how early he sets his body angle before receiving in the box." },
    ],
  },
  {
    slug: "kylian-mbappe", fullName: "Kylian Mbappé Lottin", knownAs: "Kylian Mbappé",
    nationality: "France", club: "Real Madrid", positionGroup: "ST", preferredFoot: "RIGHT",
    archetype: "Explosive transition finisher", tagline: "From halfway line to goal in four seconds",
    metrics: m(95, 88, 82, 93, 55, 45, 45, 30, 55, 100, 72, 62),
    styleSummary:
      "The most dangerous open-field attacker in the sport: devastating first step, full-sprint ball control, and a finisher's calm at the end of chaos. Conserves energy off-ball to detonate in transition.",
    studyClips: [
      { title: "Transition sprints", youtubeQuery: "Mbappe counter attack runs analysis", focusPoint: "Watch where he is BEFORE the turnover — already leaning into space." },
      { title: "Finishing at speed", youtubeQuery: "Mbappe finishing at full sprint", focusPoint: "His last touch before shooting is always out of his feet, never under them." },
    ],
  },
  {
    slug: "alexander-isak", fullName: "Alexander Isak", knownAs: "Alexander Isak",
    nationality: "Sweden", club: "Liverpool", positionGroup: "ST", preferredFoot: "RIGHT",
    archetype: "Gliding technical striker", tagline: "A winger's feet in a striker's body",
    metrics: m(82, 72, 74, 88, 55, 50, 55, 40, 60, 85, 70, 65),
    styleSummary:
      "Long-striding, silky striker who drifts wide and carries past defenders like a winger, then finishes with either foot. Beats you with glide, not collision.",
    studyClips: [
      { title: "Carrying from wide", youtubeQuery: "Isak dribbling runs analysis", focusPoint: "Watch him receive on the left touchline and attack the box diagonally." },
      { title: "Composed finishing", youtubeQuery: "Alexander Isak finishing compilation", focusPoint: "Note the pause — he waits for the keeper to commit first." },
    ],
  },
  {
    slug: "julian-alvarez", fullName: "Julián Álvarez", knownAs: "Julián Álvarez",
    nationality: "Argentina", club: "Atlético Madrid", positionGroup: "ST", preferredFoot: "RIGHT",
    archetype: "Pressing false 9", tagline: "The striker who defends from the front",
    metrics: m(72, 60, 85, 82, 62, 55, 90, 60, 65, 75, 92, 75),
    styleSummary:
      "Relentless work-rate forward who presses like a midfielder, links play in tight spaces, and arrives late in the box. Creates as much through harassment as through touches.",
    studyClips: [
      { title: "Pressing triggers", youtubeQuery: "Julian Alvarez pressing analysis", focusPoint: "Watch which pass he uses as the trigger to sprint — usually the back-pass." },
      { title: "Link play", youtubeQuery: "Julian Alvarez link up play", focusPoint: "One-touch layoffs, then an immediate run beyond the ball." },
    ],
  },

  // ─────────────────────────── Wingers ───────────────────────────
  {
    slug: "vinicius-junior", fullName: "Vinícius José Paixão de Oliveira Júnior", knownAs: "Vinícius Jr.",
    nationality: "Brazil", club: "Real Madrid", positionGroup: "W", preferredFoot: "RIGHT",
    archetype: "Explosive transitional winger", tagline: "Isolation is a goal waiting to happen",
    metrics: m(96, 97, 80, 78, 50, 40, 50, 30, 55, 97, 78, 58),
    styleSummary:
      "Hunts one-v-one isolations on the left and wins them with raw acceleration and relentless ambition. Every touch is aimed at the byline or the box — vertical to the point of obsession.",
    studyClips: [
      { title: "1v1 patterns", youtubeQuery: "Vinicius Jr dribbling skills analysis", focusPoint: "Watch the touch tempo: slow-slow-EXPLODE, always attacking the defender's front foot." },
      { title: "Transition running", youtubeQuery: "Vinicius Jr counter attacks Real Madrid", focusPoint: "Note his starting width — hugging the touchline to stretch the recovery line." },
    ],
  },
  {
    slug: "lamine-yamal", fullName: "Lamine Yamal Nasraoui Ebana", knownAs: "Lamine Yamal",
    nationality: "Spain", club: "FC Barcelona", positionGroup: "W", preferredFoot: "LEFT",
    archetype: "Inverted creative winger", tagline: "Sees passes other players don't know exist",
    metrics: m(80, 90, 90, 72, 82, 70, 45, 32, 40, 80, 70, 80),
    styleSummary:
      "Left-footed right winger who cuts inside to create rather than just to shoot. Combines a dribbler's bravery with a playmaker's vision — the defender must respect both, and dies to whichever he ignores.",
    studyClips: [
      { title: "Cutting inside to create", youtubeQuery: "Lamine Yamal assists analysis", focusPoint: "Watch his head come up the instant the defender opens his hips." },
      { title: "Receiving under pressure", youtubeQuery: "Lamine Yamal ball control tight spaces", focusPoint: "First touch always breaks the pressing angle, never straight back." },
    ],
  },
  {
    slug: "mohamed-salah", fullName: "Mohamed Salah Hamed Mahrous Ghaly", knownAs: "Mohamed Salah",
    nationality: "Egypt", club: "Liverpool", positionGroup: "W", preferredFoot: "LEFT",
    archetype: "Inverted goalscoring winger", tagline: "A striker disguised as a winger",
    metrics: m(90, 78, 82, 94, 60, 45, 60, 38, 50, 88, 85, 68),
    styleSummary:
      "Starts wide right, finishes central: darting inside runs, ruthless left-foot finishing, and season-after-season output. The model for any wide player who measures himself in goals.",
    studyClips: [
      { title: "Inside runs", youtubeQuery: "Salah movement analysis Liverpool", focusPoint: "Watch him attack the gap between fullback and center back, not the fullback himself." },
      { title: "Near-post finishing", youtubeQuery: "Salah goals compilation left foot", focusPoint: "Note how often he shoots across the keeper to the far corner." },
    ],
  },
  {
    slug: "jeremy-doku", fullName: "Jérémy Doku", knownAs: "Jérémy Doku",
    nationality: "Belgium", club: "Manchester City", positionGroup: "W", preferredFoot: "RIGHT",
    archetype: "Touchline take-on specialist", tagline: "The purest dribbler in the game",
    metrics: m(85, 99, 70, 55, 45, 35, 55, 35, 50, 96, 80, 50),
    styleSummary:
      "Old-school touchline winger: receives feet-to-feet, squares up the fullback, and beats him — over and over. His value is chaos: every take-on collapses a defensive line.",
    studyClips: [
      { title: "Take-on technique", youtubeQuery: "Doku dribbling analysis", focusPoint: "Watch the stationary start — he beats defenders from a standstill with pure burst." },
      { title: "Byline deliveries", youtubeQuery: "Doku assists cutbacks", focusPoint: "The cutback to the penalty spot is the default end product, not the cross." },
    ],
  },
  {
    slug: "khvicha-kvaratskhelia", fullName: "Khvicha Kvaratskhelia", knownAs: "Khvicha Kvaratskhelia",
    nationality: "Georgia", club: "Paris Saint-Germain", positionGroup: "W", preferredFoot: "RIGHT",
    archetype: "Inverted chaos dribbler", tagline: "Unpredictable by design",
    metrics: m(88, 92, 78, 70, 58, 48, 60, 38, 52, 85, 80, 60),
    styleSummary:
      "Left-sided winger who improvises constantly — feints, chops, and direction changes that follow no pattern a defender can study. High-volume, high-ambition, willing to lose the ball to win the moment.",
    studyClips: [
      { title: "Improvised take-ons", youtubeQuery: "Kvaratskhelia skills analysis", focusPoint: "Notice there is no signature move — the unpredictability IS the move." },
      { title: "Shooting from the half-space", youtubeQuery: "Kvaratskhelia goals cut inside", focusPoint: "Watch the disguised shot: same body shape as the cross until the last instant." },
    ],
  },
  {
    slug: "bukayo-saka", fullName: "Bukayo Saka", knownAs: "Bukayo Saka",
    nationality: "England", club: "Arsenal", positionGroup: "W", preferredFoot: "LEFT",
    archetype: "Two-way complete winger", tagline: "Reliable brilliance, both directions",
    metrics: m(82, 80, 80, 75, 65, 58, 65, 48, 55, 82, 85, 70),
    styleSummary:
      "The complete modern winger: beats his man, combines short with the overlapping fullback, tracks back, and produces goals AND assists every season. No weakness to hide, no shift skipped.",
    studyClips: [
      { title: "Combination play on the right", youtubeQuery: "Saka Odegaard combination analysis", focusPoint: "Watch the third-man pattern: Saka in, Ødegaard around, fullback beyond." },
      { title: "Defensive tracking", youtubeQuery: "Saka defensive work rate", focusPoint: "He sprints back to the fullback slot — a winger who defends like it's his job, because it is." },
    ],
  },

  // ─────────────────────── Attacking midfielders ───────────────────────
  {
    slug: "kevin-de-bruyne", fullName: "Kevin De Bruyne", knownAs: "Kevin De Bruyne",
    nationality: "Belgium", club: "Napoli", positionGroup: "AM", preferredFoot: "RIGHT",
    archetype: "Creative low-tempo playmaker", tagline: "The final pass, perfected",
    metrics: m(85, 55, 95, 70, 98, 88, 55, 45, 50, 60, 75, 90),
    styleSummary:
      "Operates in the right half-space at his own tempo, hitting whipped crosses and threaded through-balls no one else attempts. Doesn't need to beat his man — the pass beats everyone.",
    studyClips: [
      { title: "Half-space positioning", youtubeQuery: "De Bruyne half space analysis", focusPoint: "Freeze the frame when he receives: always between the lines, always side-on." },
      { title: "The trademark cross", youtubeQuery: "De Bruyne crosses assists compilation", focusPoint: "Watch the delivery point — behind the defense, in front of the keeper, every time." },
    ],
  },
  {
    slug: "jamal-musiala", fullName: "Jamal Musiala", knownAs: "Jamal Musiala",
    nationality: "Germany", club: "Bayern Munich", positionGroup: "AM", preferredFoot: "RIGHT",
    archetype: "Slaloming interior dribbler", tagline: "Moves through midfields like water",
    metrics: m(82, 93, 85, 68, 60, 60, 55, 40, 42, 80, 75, 72),
    styleSummary:
      "Receives between the lines and wriggles through impossible gaps with micro-touches and hip feints. The rare 10 whose primary creative weapon is the carry, not the pass.",
    studyClips: [
      { title: "Dribbling in traffic", youtubeQuery: "Musiala dribbling analysis tight spaces", focusPoint: "Count the touches — tiny, constant, ball never more than a foot away." },
      { title: "Receiving between lines", youtubeQuery: "Musiala receiving between the lines", focusPoint: "Watch his scan-then-spin: he knows his escape route before the ball arrives." },
    ],
  },
  {
    slug: "jude-bellingham", fullName: "Jude Victor William Bellingham", knownAs: "Jude Bellingham",
    nationality: "England", club: "Real Madrid", positionGroup: "AM", preferredFoot: "RIGHT",
    archetype: "Box-crashing shadow striker", tagline: "Arrives when it matters, wins what it takes",
    metrics: m(80, 70, 82, 82, 62, 60, 78, 60, 78, 75, 90, 75),
    styleSummary:
      "A midfielder who scores like a striker by timing late runs into the box, welded to a competitor's engine — duels, presses, and drags his team forward by force of will.",
    studyClips: [
      { title: "Late box arrivals", youtubeQuery: "Bellingham late runs goals analysis", focusPoint: "Watch when he starts the run — as the winger's head comes up, not before." },
      { title: "Physical midfield play", youtubeQuery: "Bellingham duels physicality", focusPoint: "Note how he uses his frame to protect the ball through contact." },
    ],
  },
  {
    slug: "martin-odegaard", fullName: "Martin Ødegaard", knownAs: "Martin Ødegaard",
    nationality: "Norway", club: "Arsenal", positionGroup: "AM", preferredFoot: "LEFT",
    archetype: "Tempo-dictating orchestrator", tagline: "The conductor with a press-trigger",
    metrics: m(72, 60, 88, 60, 85, 92, 68, 50, 45, 58, 80, 92),
    styleSummary:
      "Controls the game's rhythm from the right half-space: two-touch circulation to lull the block, then the sudden vertical ball the pause disguised. Leads the press by example.",
    studyClips: [
      { title: "Tempo control", youtubeQuery: "Odegaard tempo control analysis Arsenal", focusPoint: "Watch a 5-minute stretch: notice when he deliberately slows play, and what he's waiting for." },
      { title: "Scanning habits", youtubeQuery: "Odegaard scanning awareness", focusPoint: "Count shoulder checks in the 3 seconds before he receives — usually two or three." },
    ],
  },
  {
    slug: "bruno-fernandes", fullName: "Bruno Miguel Borges Fernandes", knownAs: "Bruno Fernandes",
    nationality: "Portugal", club: "Manchester United", positionGroup: "AM", preferredFoot: "RIGHT",
    archetype: "High-risk vertical creator", tagline: "Always forward, whatever the cost",
    metrics: m(90, 50, 86, 74, 90, 70, 70, 45, 55, 55, 85, 85),
    styleSummary:
      "The anti-safe playmaker: attempts the line-breaking ball on every possession, accepting turnovers as the tax on chance creation. Huge output, huge volume, zero hesitation.",
    studyClips: [
      { title: "Risk-taking passes", youtubeQuery: "Bruno Fernandes through balls analysis", focusPoint: "Watch how early he releases — often first-time, before the defense sets." },
      { title: "Set-piece delivery", youtubeQuery: "Bruno Fernandes free kicks corners", focusPoint: "Study the variety of deliveries from identical run-ups." },
    ],
  },

  // ─────────────────────── Central midfielders ───────────────────────
  {
    slug: "federico-valverde", fullName: "Federico Santiago Valverde Dipetta", knownAs: "Federico Valverde",
    nationality: "Uruguay", club: "Real Madrid", positionGroup: "CM", preferredFoot: "RIGHT",
    archetype: "Box-to-box engine", tagline: "Covers every blade of grass, then shoots from 30",
    metrics: m(85, 55, 65, 65, 75, 55, 80, 70, 75, 85, 97, 70),
    styleSummary:
      "The most complete athlete in midfield: defends like a 6, sprints like a winger, and detonates long-range strikes. Wins games with running volume that never drops.",
    studyClips: [
      { title: "Box-to-box shifts", youtubeQuery: "Valverde box to box analysis", focusPoint: "Track him for one full possession cycle — box to box, both directions." },
      { title: "Long-range striking", youtubeQuery: "Valverde long shots compilation", focusPoint: "Watch the setup touch — always pushing the ball out of stride into open space." },
    ],
  },
  {
    slug: "pedri", fullName: "Pedro González López", knownAs: "Pedri",
    nationality: "Spain", club: "FC Barcelona", positionGroup: "CM", preferredFoot: "RIGHT",
    archetype: "Press-resistant tempo metronome", tagline: "Never hurried, never caught",
    metrics: m(65, 65, 82, 45, 78, 90, 60, 55, 45, 60, 82, 92),
    styleSummary:
      "Receives under pressure like it isn't there: pre-scanned, side-on, one touch into space. Dictates rhythm through positioning and timing rather than range or power.",
    studyClips: [
      { title: "Press resistance", youtubeQuery: "Pedri press resistance analysis", focusPoint: "Watch the body shape before receiving — half-turned, escape route already chosen." },
      { title: "Positional play", youtubeQuery: "Pedri positioning Barcelona analysis", focusPoint: "Note how he finds the pocket the opponent's midfield shape can't cover." },
    ],
  },
  {
    slug: "bernardo-silva", fullName: "Bernardo Mota Veiga de Carvalho e Silva", knownAs: "Bernardo Silva",
    nationality: "Portugal", club: "Manchester City", positionGroup: "CM", preferredFoot: "LEFT",
    archetype: "Retention dribbler", tagline: "You cannot take the ball from him",
    metrics: m(60, 80, 78, 50, 70, 82, 72, 58, 48, 62, 88, 85),
    styleSummary:
      "Dribbles to keep, not to beat: shields, pivots, and escapes pressure in phone-booth spaces, letting his team breathe. Pairs it with sneaky-elite pressing intelligence.",
    studyClips: [
      { title: "Shielding under pressure", youtubeQuery: "Bernardo Silva ball retention analysis", focusPoint: "Watch his hips — always between defender and ball, ball on the far foot." },
      { title: "Pressing intelligence", youtubeQuery: "Bernardo Silva pressing analysis", focusPoint: "He curves his runs to press ball AND passing lane at once." },
    ],
  },
  {
    slug: "tijjani-reijnders", fullName: "Tijjani Reijnders", knownAs: "Tijjani Reijnders",
    nationality: "Netherlands", club: "Manchester City", positionGroup: "CM", preferredFoot: "RIGHT",
    archetype: "Progressive carrier", tagline: "Breaks lines with the ball at his feet",
    metrics: m(88, 70, 72, 60, 72, 65, 65, 55, 50, 72, 85, 72),
    styleSummary:
      "Elegant left-sided 8 whose signature is the carry through midfield: receives deep, glides past the first line, and keeps going. Advances the ball 20 meters where others pass sideways.",
    studyClips: [
      { title: "Line-breaking carries", youtubeQuery: "Reijnders progressive carries analysis", focusPoint: "Watch the first touch — always forward, past the presser's reach." },
      { title: "Late arrivals", youtubeQuery: "Reijnders goals runs from midfield", focusPoint: "Note the second run after releasing the ball — carry, pass, go again." },
    ],
  },
  {
    slug: "eduardo-camavinga", fullName: "Eduardo Célmi Camavinga", knownAs: "Eduardo Camavinga",
    nationality: "France", club: "Real Madrid", positionGroup: "CM", preferredFoot: "LEFT",
    archetype: "Dynamic duel-winning carrier", tagline: "Wins it, then runs with it",
    metrics: m(72, 75, 60, 40, 65, 60, 78, 68, 80, 80, 88, 68),
    styleSummary:
      "Combines a destroyer's bite with a carrier's escape: wins the tackle and immediately surges upfield with long, elastic strides. Chaos-proof in transition defense.",
    studyClips: [
      { title: "Tackle-and-carry sequences", youtubeQuery: "Camavinga tackles dribbles analysis", focusPoint: "Watch the transition instant — the tackle IS the first touch of the carry." },
      { title: "Recovery defending", youtubeQuery: "Camavinga recovery runs defense", focusPoint: "Note the top-speed recovery sprints that erase counters." },
    ],
  },

  // ─────────────────────── Defensive midfielders ───────────────────────
  {
    slug: "rodri", fullName: "Rodrigo Hernández Cascante", knownAs: "Rodri",
    nationality: "Spain", club: "Manchester City", positionGroup: "DM", preferredFoot: "RIGHT",
    archetype: "Deep-lying orchestrator", tagline: "The game runs through him, at his speed",
    metrics: m(60, 40, 70, 50, 90, 98, 65, 90, 70, 40, 80, 98),
    styleSummary:
      "The reference point for every possession: constant scanning, perfect body orientation, and a pass selection that always chooses control over spectacle. Screens the back line by standing where danger would be born.",
    studyClips: [
      { title: "Scanning and retention", youtubeQuery: "Rodri scanning analysis", focusPoint: "Count his shoulder checks over 60 seconds of possession — it never stops." },
      { title: "Defensive positioning", youtubeQuery: "Rodri defensive positioning analysis", focusPoint: "Watch him screen the passing lane BEFORE the pass is even considered." },
    ],
  },
  {
    slug: "declan-rice", fullName: "Declan Rice", knownAs: "Declan Rice",
    nationality: "England", club: "Arsenal", positionGroup: "DM", preferredFoot: "RIGHT",
    archetype: "Hybrid destroyer-progressor", tagline: "Ends their attack, starts yours",
    metrics: m(72, 50, 60, 45, 70, 68, 78, 88, 82, 70, 90, 80),
    styleSummary:
      "Elite ball-winner who evolved a progression game: interception, then a driving carry or a switch. Big-moment defensive interventions with the engine to repeat them all match.",
    studyClips: [
      { title: "Interception reading", youtubeQuery: "Declan Rice interceptions analysis", focusPoint: "Watch his eyes track the passer's hips, not the ball." },
      { title: "Carrying after the win", youtubeQuery: "Declan Rice ball carrying analysis", focusPoint: "Note the instant transition from tackle to forward carry." },
    ],
  },
  {
    slug: "bruno-guimaraes", fullName: "Bruno Guimarães Rodriguez Moura", knownAs: "Bruno Guimarães",
    nationality: "Brazil", club: "Newcastle United", positionGroup: "DM", preferredFoot: "RIGHT",
    archetype: "Combative technical pivot", tagline: "Street-fight edge, playmaker's touch",
    metrics: m(68, 65, 68, 48, 75, 78, 75, 72, 78, 55, 85, 78),
    styleSummary:
      "A pivot who thrives in scraps: takes the ball in traffic, invites contact, and escapes with disguised touches. Marries South American flair with genuine defensive nastiness.",
    studyClips: [
      { title: "Playing through contact", youtubeQuery: "Bruno Guimaraes press resistance", focusPoint: "Watch him bait the presser in, then play through the space they vacated." },
      { title: "Tempo from deep", youtubeQuery: "Bruno Guimaraes passing analysis", focusPoint: "Note the mix: nine safe passes to move the block, one dagger to break it." },
    ],
  },
  {
    slug: "joao-palhinha", fullName: "João Maria Lobo Alves Palhinha Gonçalves", knownAs: "João Palhinha",
    nationality: "Portugal", club: "Tottenham Hotspur", positionGroup: "DM", preferredFoot: "RIGHT",
    archetype: "Pure destroyer", tagline: "The tackle is the art form",
    metrics: m(40, 25, 35, 40, 50, 45, 85, 92, 98, 60, 82, 70),
    styleSummary:
      "The league's tackling machine: reads, arrives, and takes ball and momentum in one clean bite. Keeps distribution simple by choice — his job is to make the opponent's 10 disappear.",
    studyClips: [
      { title: "Tackling technique", youtubeQuery: "Palhinha tackles compilation analysis", focusPoint: "Watch the timing — he tackles the touch, not the player." },
      { title: "Screening the back line", youtubeQuery: "Palhinha defensive positioning", focusPoint: "Note his depth: always goal-side of the opponent's most advanced midfielder." },
    ],
  },

  // ─────────────────────────── Fullbacks ───────────────────────────
  {
    slug: "achraf-hakimi", fullName: "Achraf Hakimi Mouh", knownAs: "Achraf Hakimi",
    nationality: "Morocco", club: "Paris Saint-Germain", positionGroup: "FB", preferredFoot: "RIGHT",
    archetype: "Overlapping rocket wingback", tagline: "A winger wearing a defender's number",
    metrics: m(92, 70, 72, 60, 55, 40, 70, 60, 60, 95, 90, 60),
    styleSummary:
      "Attacks the entire right flank at sprint speed, arriving in the box like a second striker. His overlaps aren't support runs — they're the main threat.",
    studyClips: [
      { title: "Overlap timing", youtubeQuery: "Hakimi overlapping runs analysis", focusPoint: "Watch when he launches — as his winger receives, not after." },
      { title: "Box arrivals from fullback", youtubeQuery: "Hakimi goals runs analysis", focusPoint: "Note the finishing positions: penalty spot, like a striker." },
    ],
  },
  {
    slug: "trent-alexander-arnold", fullName: "Trent John Alexander-Arnold", knownAs: "Trent Alexander-Arnold",
    nationality: "England", club: "Real Madrid", positionGroup: "FB", preferredFoot: "RIGHT",
    archetype: "Inverted playmaking fullback", tagline: "Quarterback from the right-back slot",
    metrics: m(80, 40, 78, 45, 98, 75, 50, 55, 45, 60, 78, 82),
    styleSummary:
      "Redefined the position: steps into midfield and delivers a playmaker's passing range — whipped crosses, 60-yard switches, through-balls — from fullback. Creation is the identity; defending is the day job.",
    studyClips: [
      { title: "Switch-of-play range", youtubeQuery: "Trent Alexander-Arnold passing range analysis", focusPoint: "Watch the trajectory choice: flat and fast to feet, or floated behind the line." },
      { title: "Inverting into midfield", youtubeQuery: "Trent inverted fullback analysis", focusPoint: "Note WHEN he steps inside — only once his winger pins the opposing fullback wide." },
    ],
  },
  {
    slug: "alphonso-davies", fullName: "Alphonso Boyle Davies", knownAs: "Alphonso Davies",
    nationality: "Canada", club: "Bayern Munich", positionGroup: "FB", preferredFoot: "LEFT",
    archetype: "Explosive dribbling fullback", tagline: "The fastest recovery in football",
    metrics: m(88, 82, 65, 40, 48, 38, 68, 62, 65, 98, 90, 58),
    styleSummary:
      "A converted winger whose left-back play is built on outrageous pace both ways: touchline carries going forward, game-saving recovery sprints going back.",
    studyClips: [
      { title: "Carrying up the flank", youtubeQuery: "Alphonso Davies runs dribbling analysis", focusPoint: "Watch the long touch past the presser — only viable because he wins every footrace." },
      { title: "Recovery speed", youtubeQuery: "Alphonso Davies recovery sprints defense", focusPoint: "Study the angle: he runs to the interception point, not at the attacker." },
    ],
  },
  {
    slug: "aaron-wan-bissaka", fullName: "Aaron Wan-Bissaka", knownAs: "Aaron Wan-Bissaka",
    nationality: "England", club: "West Ham United", positionGroup: "FB", preferredFoot: "RIGHT",
    archetype: "Duel-dominant defensive fullback", tagline: "Nobody dribbles past him. Nobody.",
    metrics: m(55, 55, 40, 30, 42, 35, 70, 80, 95, 80, 85, 60),
    styleSummary:
      "The definitive one-v-one defender: patient stance, freakish reach, and a spider-tackle that ends wingers' evenings. His attacking game is functional; his defending is generational.",
    studyClips: [
      { title: "1v1 defending", youtubeQuery: "Wan-Bissaka 1v1 defending analysis", focusPoint: "Watch the stance: never lunging first, always forcing the winger to commit." },
      { title: "The recovery tackle", youtubeQuery: "Wan-Bissaka tackles compilation", focusPoint: "Note the late reach-around tackle timed to the attacker's shooting touch." },
    ],
  },

  // ─────────────────────────── Center backs ───────────────────────────
  {
    slug: "virgil-van-dijk", fullName: "Virgil van Dijk", knownAs: "Virgil van Dijk",
    nationality: "Netherlands", club: "Liverpool", positionGroup: "CB", preferredFoot: "RIGHT",
    archetype: "Commanding ball-playing colossus", tagline: "Defends with his brain, wins with his presence",
    metrics: m(60, 25, 45, 45, 88, 80, 45, 96, 85, 60, 75, 90),
    styleSummary:
      "Organizes the entire defensive line with positioning and voice, defends one-v-one without ever diving in, and launches attacks with 60-yard diagonals. Calm is the superpower.",
    studyClips: [
      { title: "Defending without tackling", youtubeQuery: "Van Dijk defending analysis positioning", focusPoint: "Watch how rarely he tackles — the position makes the tackle unnecessary." },
      { title: "Long diagonal distribution", youtubeQuery: "Van Dijk long passes analysis", focusPoint: "Note the trigger: opposition winger presses, the diagonal punishes the space behind." },
    ],
  },
  {
    slug: "ruben-dias", fullName: "Rúben Santos Gato Alves Dias", knownAs: "Rúben Dias",
    nationality: "Portugal", club: "Manchester City", positionGroup: "CB", preferredFoot: "RIGHT",
    archetype: "Defensive organizer", tagline: "The back line's brain",
    metrics: m(50, 20, 40, 35, 70, 70, 55, 95, 82, 50, 80, 88),
    styleSummary:
      "Wins with anticipation and communication: constant pointing, constant adjustment, blocks and interceptions born from reading the play two passes ahead.",
    studyClips: [
      { title: "Organizing the line", youtubeQuery: "Ruben Dias leadership defending analysis", focusPoint: "Watch him between actions — always talking, always pointing." },
      { title: "Block positioning", youtubeQuery: "Ruben Dias blocks interceptions", focusPoint: "Note how he shows shooters onto the covered side." },
    ],
  },
  {
    slug: "william-saliba", fullName: "William Alain André Gabriel Saliba", knownAs: "William Saliba",
    nationality: "France", club: "Arsenal", positionGroup: "CB", preferredFoot: "RIGHT",
    archetype: "Composed athletic stopper", tagline: "Never rushed, never beaten",
    metrics: m(55, 35, 40, 30, 72, 65, 50, 92, 78, 75, 80, 85),
    styleSummary:
      "Combines recovery pace with unnatural composure: defends huge spaces behind a high line and strolls out of pressure like it's a warm-up drill.",
    studyClips: [
      { title: "Defending the high line", youtubeQuery: "Saliba high line defending analysis", focusPoint: "Watch the delayed turn-and-sprint — he waits until the through-ball is committed." },
      { title: "Calm build-up", youtubeQuery: "Saliba ball playing composure", focusPoint: "Note the shoulder feint before playing through the first press line." },
    ],
  },
  {
    slug: "alessandro-bastoni", fullName: "Alessandro Bastoni", knownAs: "Alessandro Bastoni",
    nationality: "Italy", club: "Inter Milan", positionGroup: "CB", preferredFoot: "LEFT",
    archetype: "Progressive wide center back", tagline: "A defender who creates",
    metrics: m(72, 40, 55, 35, 85, 68, 55, 85, 72, 55, 78, 82),
    styleSummary:
      "The modern left-sided CB: steps into midfield, overlaps his wingback, and delivers crosses and through-balls that most midfielders can't. Defending plus genuine chance creation.",
    studyClips: [
      { title: "Stepping out from the back", youtubeQuery: "Bastoni stepping out analysis Inter", focusPoint: "Watch the trigger: his marker follows the wingback, and he drives into the vacated lane." },
      { title: "Left-foot deliveries", youtubeQuery: "Bastoni assists passing analysis", focusPoint: "Note the underlap position he crosses from — a fullback's spot, a defender's shirt." },
    ],
  },
  {
    slug: "josko-gvardiol", fullName: "Joško Gvardiol", knownAs: "Joško Gvardiol",
    nationality: "Croatia", club: "Manchester City", positionGroup: "CB", preferredFoot: "LEFT",
    archetype: "Ball-carrying hybrid defender", tagline: "Center back body, fullback ambition",
    metrics: m(78, 55, 55, 40, 68, 60, 60, 82, 75, 78, 82, 75),
    styleSummary:
      "Blurs the line between defender and attacker: carries out of the back line through midfield, finishes moves in the opposition box, and still wins his duels at home.",
    studyClips: [
      { title: "Carries from defense", youtubeQuery: "Gvardiol ball carrying runs analysis", focusPoint: "Watch how a defender's carry breaks TWO lines — nobody is assigned to press him." },
      { title: "Attacking the box", youtubeQuery: "Gvardiol goals runs forward", focusPoint: "Note the timing: he goes when the opponent's midfield is pinned deep." },
    ],
  },

  // ─────────────────────────── Goalkeepers ───────────────────────────
  {
    slug: "ederson", fullName: "Ederson Santana de Moraes", knownAs: "Ederson",
    nationality: "Brazil", club: "Fenerbahçe", positionGroup: "GK", preferredFoot: "LEFT",
    archetype: "Sweeper-distributor", tagline: "The first playmaker",
    metrics: m(55, 15, 30, 5, 95, 75, 20, 85, 55, 55, 50, 88),
    styleSummary:
      "A keeper whose defining actions happen with his feet: 70-yard flat assists, one-touch escapes from the press, and a starting position 25 yards off his line.",
    studyClips: [
      { title: "Distribution range", youtubeQuery: "Ederson passing assists goalkeeper", focusPoint: "Watch the flat driven pass over the press — a quarterback's throw with his foot." },
      { title: "Sweeping behind the line", youtubeQuery: "Ederson sweeper keeper analysis", focusPoint: "Note his starting position when the ball is in the opponent's half." },
    ],
  },
  {
    slug: "thibaut-courtois", fullName: "Thibaut Nicolas Marc Courtois", knownAs: "Thibaut Courtois",
    nationality: "Belgium", club: "Real Madrid", positionGroup: "GK", preferredFoot: "LEFT",
    archetype: "Elite shot-stopper", tagline: "The wall at the end of everything",
    metrics: m(25, 5, 20, 5, 55, 50, 10, 96, 70, 65, 50, 80),
    styleSummary:
      "The classical great: enormous frame, perfect angles, and big-game saves that decide finals. Positioning so exact that impossible saves look routine.",
    studyClips: [
      { title: "Positioning and angles", youtubeQuery: "Courtois positioning analysis saves", focusPoint: "Freeze frame at the shot: he's centered on the ball's angle, never the goal's." },
      { title: "1v1 stops", youtubeQuery: "Courtois one on one saves", focusPoint: "Watch the patience — he never commits first, forcing the striker to choose." },
    ],
  },
];
