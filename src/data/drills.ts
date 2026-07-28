/**
 * The drill library — reusable content atoms for training programs.
 * Programs (src/data/programs.ts) compose sessions from these keys and the
 * generator applies week-by-week progression, so 8-week × 4-session programs
 * stay authorable without hand-writing 32 unique sessions per pro.
 *
 * `videoQuery` is a YouTube search string (same policy as pro study clips:
 * never fabricate video ids; curate real links editorially later).
 */

export type DrillFocus =
  | "STRENGTH"
  | "SPEED"
  | "CONDITIONING"
  | "TECHNICAL"
  | "TACTICAL";

export interface Drill {
  key: string;
  name: string;
  focus: DrillFocus;
  sets: number;
  reps: string; // "8 each leg", "4 × 30s", "20 balls"
  cues: string[];
  videoQuery: string;
}

export const DRILLS: Record<string, Drill> = Object.fromEntries(
  (
    [
      // ── Strength ──
      { key: "trap-bar-deadlift", name: "Trap-bar deadlift", focus: "STRENGTH", sets: 4, reps: "5 at heavy-but-crisp load", cues: ["Push the floor away — the bar goes up because the ground goes down", "Every rep explosive on the way up"], videoQuery: "trap bar deadlift technique athletes" },
      { key: "rfe-split-squat", name: "Rear-foot-elevated split squat", focus: "STRENGTH", sets: 3, reps: "8 each leg", cues: ["Front shin vertical, drive through mid-foot", "Control down in 3 seconds, up in 1"], videoQuery: "rear foot elevated split squat soccer" },
      { key: "nordic-curl", name: "Nordic hamstring curl", focus: "STRENGTH", sets: 3, reps: "5 slow negatives", cues: ["Fight the fall for as long as possible", "Hips stay extended — no folding"], videoQuery: "nordic hamstring curl progression" },
      { key: "single-leg-rdl", name: "Single-leg Romanian deadlift", focus: "STRENGTH", sets: 3, reps: "8 each leg", cues: ["Hips square to the floor throughout", "Feel the hamstring load, not the lower back"], videoQuery: "single leg RDL soccer players" },
      { key: "hip-thrust", name: "Barbell hip thrust", focus: "STRENGTH", sets: 4, reps: "8", cues: ["Full lockout — squeeze for a full second at the top", "Ribs down, no arching"], videoQuery: "hip thrust technique sprinting" },
      { key: "weighted-step-up", name: "Weighted box step-up", focus: "STRENGTH", sets: 3, reps: "6 each leg", cues: ["All the work from the top leg — no push off the floor", "Stand tall at the top, knee drive finish"], videoQuery: "weighted step up soccer strength" },
      { key: "copenhagen-plank", name: "Copenhagen adductor plank", focus: "STRENGTH", sets: 3, reps: "20s each side", cues: ["Body in one straight line", "Builds the groin armor every cutting athlete needs"], videoQuery: "copenhagen plank adductor exercise" },
      { key: "med-ball-rotational", name: "Med-ball rotational throw", focus: "STRENGTH", sets: 4, reps: "5 each side", cues: ["Throw with your hips, arms just deliver", "Max intent — every throw at 100%"], videoQuery: "medicine ball rotational throw power" },

      // ── Speed ──
      { key: "resisted-sprint", name: "Resisted sprint (sled or band)", focus: "SPEED", sets: 6, reps: "15m, full recovery", cues: ["45° body lean, violent arm drive", "Load light enough to stay FAST — this is sprinting, not dragging"], videoQuery: "resisted sled sprint acceleration soccer" },
      { key: "flying-10s", name: "Flying 10s", focus: "SPEED", sets: 5, reps: "20m build + 10m fly", cues: ["Build smoothly, hit max speed in the fly zone", "Relaxed face and hands at top speed"], videoQuery: "flying 10 sprint drill top speed" },
      { key: "wall-accel", name: "Wall acceleration drill", focus: "SPEED", sets: 4, reps: "2 × 10 switches", cues: ["Punch the knee through, foot strikes under the hip", "Rehearses the first three steps of every burst"], videoQuery: "wall drill acceleration technique" },
      { key: "pro-agility", name: "5-10-5 pro agility", focus: "SPEED", sets: 6, reps: "full effort, 90s rest", cues: ["Cut off the outside foot, chest over knee", "Eyes up out of every cut — like scanning mid-game"], videoQuery: "5-10-5 pro agility drill soccer" },
      { key: "bounding", name: "Alternate-leg bounding", focus: "SPEED", sets: 4, reps: "20m", cues: ["Long, springy contacts — cover ground", "Land loaded, leave instantly"], videoQuery: "bounding plyometric drill sprint power" },
      { key: "hill-sprint", name: "Hill sprints", focus: "SPEED", sets: 6, reps: "20m steep hill, walk-down rest", cues: ["The hill forces perfect acceleration angles", "Drive, drive, drive — no upright running"], videoQuery: "hill sprints acceleration training" },

      // ── Conditioning ──
      { key: "30-15", name: "30-15 intermittent runs", focus: "CONDITIONING", sets: 2, reps: "8 × (30s run / 15s walk)", cues: ["Hit the same distance every rep — pacing is the skill", "3 min between blocks"], videoQuery: "30-15 intermittent fitness test training" },
      { key: "tempo-runs", name: "Tempo runs", focus: "CONDITIONING", sets: 1, reps: "8 × 100m at 75%, walk back", cues: ["Smooth and tall — this builds the engine without frying the legs", "Same time every rep"], videoQuery: "tempo run conditioning field athletes" },
      { key: "repeat-sprints", name: "Small-area repeat sprints", focus: "CONDITIONING", sets: 3, reps: "6 × 20m shuttle / 20s rest", cues: ["Game-speed turns at every line", "This is the 85th-minute counter-attack, rehearsed"], videoQuery: "repeated sprint ability training soccer" },
      { key: "aerobic-base", name: "Aerobic base run", focus: "CONDITIONING", sets: 1, reps: "25 min conversational pace", cues: ["Nose-breathing pace — recovery fuel, not a race"], videoQuery: "zone 2 aerobic training athletes" },
      { key: "shuttle-pyramid", name: "Shuttle pyramid", focus: "CONDITIONING", sets: 2, reps: "5-10-15-20m and back down", cues: ["Decelerate in two steps, not five", "Braking is a skill — train it tired"], videoQuery: "shuttle run pyramid conditioning soccer" },

      // ── Technical ──
      { key: "wall-weak-foot", name: "Weak-foot wall passing", focus: "TECHNICAL", sets: 3, reps: "50 passes", cues: ["Two-touch: cushion with one surface, pass with another", "Weak foot only — discomfort is the point"], videoQuery: "wall passing drill weak foot soccer" },
      { key: "first-touch-air", name: "First touch from the air", focus: "TECHNICAL", sets: 3, reps: "20 balls (self-serve or partner)", cues: ["Kill it into the space you've already scanned", "Thigh, chest, laces — rotate surfaces"], videoQuery: "first touch aerial control drill" },
      { key: "dribble-slalom", name: "Slalom dribble at speed", focus: "TECHNICAL", sets: 4, reps: "6 runs through 6 cones", cues: ["Both feet, every surface", "Last two cones at max speed — game touches are fast touches"], videoQuery: "slalom dribbling drill speed soccer" },
      { key: "takeon-moves", name: "1v1 take-on move reps", focus: "TECHNICAL", sets: 4, reps: "10 each side (chop, scissor, push-explode)", cues: ["Sell the fake with your hips and eyes, not just the foot", "Explode into the space after — the move is nothing without the burst"], videoQuery: "1v1 dribbling moves training soccer" },
      { key: "driven-pass-ladder", name: "Driven-pass distance ladder", focus: "TECHNICAL", sets: 3, reps: "10 passes at 15/25/35m", cues: ["Laces through the ball's equator — flat, fizzing trajectory", "Receiver shouldn't have to move"], videoQuery: "driven pass technique long range soccer" },
      { key: "switch-long-balls", name: "Switch-of-play long balls", focus: "TECHNICAL", sets: 3, reps: "10 diagonals each foot, 30-40m", cues: ["Strike up through the ball for carry, wrap for curve", "Land it in the target square in one bounce or fewer"], videoQuery: "long diagonal switch pass drill" },
      { key: "finishing-both-posts", name: "Near-post / far-post finishing", focus: "TECHNICAL", sets: 4, reps: "8 finishes alternating corners", cues: ["Pick the corner BEFORE your last touch", "Low and hard beats high and pretty"], videoQuery: "finishing drill near post far post" },
      { key: "cutback-crossing", name: "Cutback and whipped crossing", focus: "TECHNICAL", sets: 3, reps: "10 deliveries per type", cues: ["Cutback to the penalty spot; whip between keeper and line", "Look up twice: before the touch, before the delivery"], videoQuery: "crossing drill cutback whipped soccer" },
      { key: "receive-half-turn", name: "Receiving on the half-turn", focus: "TECHNICAL", sets: 4, reps: "12 receptions", cues: ["Scan before the ball leaves the passer's foot", "Open hips, take the touch across your body into the next zone"], videoQuery: "receiving half turn drill midfielder" },
      { key: "shield-pressure", name: "Shielding under live pressure", focus: "TECHNICAL", sets: 4, reps: "30s rounds vs partner", cues: ["Arm bar legal and strong, ball on the far foot", "Feel the defender, don't look at them"], videoQuery: "shielding the ball drill soccer strength" },

      // ── Tactical / cognitive ──
      { key: "scanning-reps", name: "Scanning reps with caller", focus: "TACTICAL", sets: 4, reps: "10 receptions with number call-out", cues: ["Partner holds up fingers as the pass travels — call the number BEFORE your touch", "Two scans per reception minimum"], videoQuery: "scanning awareness drill soccer midfielder" },
      { key: "video-study", name: "Pro film study (15 min)", focus: "TACTICAL", sets: 1, reps: "15 min with notes", cues: ["Watch your matched pro's study clips — track ONE habit the whole clip", "Write down 3 moments you'll copy this week"], videoQuery: "how to analyze soccer film like a pro" },
      { key: "pressing-triggers", name: "Pressing-trigger sprints", focus: "TACTICAL", sets: 4, reps: "6 reaction sprints", cues: ["Partner's call = bad touch happened — close 10m and arrive under control", "Curve the run to cut one passing lane while you press"], videoQuery: "pressing triggers drill soccer" },
      { key: "rondo", name: "Tight rondo (4v1 / 5v2)", focus: "TACTICAL", sets: 4, reps: "3-min rounds", cues: ["One- and two-touch only", "Move two meters after every pass — the pass is half the job"], videoQuery: "rondo drill possession soccer" },
      { key: "third-man-pattern", name: "Third-man combination pattern", focus: "TACTICAL", sets: 3, reps: "10 pattern runs each position", cues: ["The first pass is bait; the second pass is the point", "Time the third run to arrive as the ball does"], videoQuery: "third man run combination drill" },
      { key: "tempo-constraint", name: "Tempo-dictation constraint game", focus: "TACTICAL", sets: 3, reps: "5-min small-sided rounds", cues: ["Round 1: max two-touch. Round 2: must slow it for 10 passes before scoring", "YOU decide when the game speeds up — that decision is the drill"], videoQuery: "small sided game tempo control soccer" },
      { key: "positioning-walkthrough", name: "Position walk-through vs shadow XI", focus: "TACTICAL", sets: 2, reps: "10-min walk-through", cues: ["Ball moves (coach or cones), you re-position BEFORE it arrives", "Say your read out loud: 'ball wide → I drop and cover'"], videoQuery: "defensive positioning shadow play soccer" },
    ] as Drill[]
  ).map((d) => [d.key, d]),
);
