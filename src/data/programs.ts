/**
 * Flagship 8-week programs, composed from the drill library.
 *
 * Each program defines 4 weekly session slots (days 1, 2, 4, 6). The
 * generator expands them across 8 weeks, applying phase-based progression:
 *   weeks 1–2 Foundation → 3–5 Build → 6–7 Peak → 8 Integration
 * so every PlanSession row has concrete sets/reps for that week.
 */

import { DRILLS, type Drill } from "./drills";

export type SessionFocus =
  | "STRENGTH"
  | "SPEED"
  | "CONDITIONING"
  | "TECHNICAL"
  | "TACTICAL"
  | "RECOVERY";

export interface ProgramDef {
  slug: string;
  proSlug: string; // FK to src/data/pros.ts
  title: string;
  description: string;
  priceCents: number;
  /** The 3 metric gaps this program is built to close (marketing + plan logic). */
  targets: string[];
  weeklyThemes: [string, string, string, string, string, string, string, string];
  sessions: { day: number; title: string; focus: SessionFocus; drills: string[] }[];
}

interface Phase {
  name: string;
  setMultiplier: number;
  note: string;
}

function phaseFor(week: number): Phase {
  if (week <= 2)
    return { name: "Foundation", setMultiplier: 1, note: "Own the movement quality first — crisp reps beat heavy reps." };
  if (week <= 5)
    return { name: "Build", setMultiplier: 1.25, note: "Volume rises this phase. Keep intent high on every rep." };
  if (week <= 7)
    return { name: "Peak", setMultiplier: 1.25, note: "Maximum intensity, full recoveries. Every rep at match speed or faster." };
  return { name: "Integration", setMultiplier: 0.75, note: "Volume drops — transfer week. Take every habit into your next match." };
}

// Type aliases (not interfaces) so the shapes satisfy Prisma's JSON input types.
export type SessionBlock = {
  name: string;
  focus: Drill["focus"];
  sets: number;
  reps: string;
  cues: string[];
  videoQuery: string;
};

export type GeneratedSession = {
  week: number;
  day: number;
  title: string;
  focus: SessionFocus;
  content: {
    phase: string;
    theme: string;
    phaseNote: string;
    blocks: SessionBlock[];
  };
};

export function buildProgramSessions(def: ProgramDef): GeneratedSession[] {
  const out: GeneratedSession[] = [];
  for (let week = 1; week <= 8; week++) {
    const phase = phaseFor(week);
    for (const slot of def.sessions) {
      const blocks: SessionBlock[] = slot.drills.map((key) => {
        const d = DRILLS[key];
        if (!d) throw new Error(`Unknown drill key "${key}" in program ${def.slug}`);
        return {
          name: d.name,
          focus: d.focus,
          sets: Math.max(1, Math.round(d.sets * phase.setMultiplier)),
          reps: d.reps,
          cues: d.cues,
          videoQuery: d.videoQuery,
        };
      });
      out.push({
        week,
        day: slot.day,
        title: `${slot.title} — ${phase.name} ${week}`,
        focus: slot.focus,
        content: {
          phase: phase.name,
          theme: def.weeklyThemes[week - 1],
          phaseNote: phase.note,
          blocks,
        },
      });
    }
  }
  return out;
}

export const PROGRAMS: ProgramDef[] = [
  {
    slug: "de-bruyne-blueprint",
    proSlug: "kevin-de-bruyne",
    title: "The De Bruyne Blueprint: 8-Week Playmaker Program",
    description:
      "Build the passing range, scanning habits, and half-space craft of an elite playmaker. Four sessions a week: a passing-range lab, a scanning and tempo module, an explosive strength base, and a playmaker's engine block.",
    priceCents: 4900,
    targets: ["passingRange", "scanning", "spatialCreation"],
    weeklyThemes: [
      "Set the base: scan before every touch",
      "Weak foot joins the conversation",
      "Range: 25 meters becomes routine",
      "The half-space becomes home",
      "Third-man thinking",
      "Deliveries under fatigue",
      "Match-speed everything",
      "Take it to the weekend",
    ],
    sessions: [
      { day: 1, title: "Passing Range Lab", focus: "TECHNICAL", drills: ["driven-pass-ladder", "switch-long-balls", "wall-weak-foot", "cutback-crossing"] },
      { day: 2, title: "Scanning & Tempo", focus: "TACTICAL", drills: ["scanning-reps", "receive-half-turn", "third-man-pattern", "video-study"] },
      { day: 4, title: "Explosive Base", focus: "STRENGTH", drills: ["trap-bar-deadlift", "rfe-split-squat", "med-ball-rotational", "flying-10s"] },
      { day: 6, title: "Playmaker Engine", focus: "CONDITIONING", drills: ["30-15", "tempo-runs", "finishing-both-posts", "tempo-constraint"] },
    ],
  },
  {
    slug: "vinicius-protocol",
    proSlug: "vinicius-junior",
    title: "The Vinícius Protocol: 8-Week Explosive Winger Program",
    description:
      "Develop the first-step separation, 1v1 arsenal, and transition engine of an elite winger. Four sessions a week: first-step ignition, a 1v1 laboratory, a lower-body power base, and a transition conditioning block.",
    priceCents: 4900,
    targets: ["explosiveness", "dribbleDensity", "verticalProgression"],
    weeklyThemes: [
      "Acceleration mechanics: the first three steps",
      "Two moves, mastered — not ten, sampled",
      "Power floor: force into the ground",
      "The move plus the burst",
      "Top speed with the ball",
      "Finishing the runs you create",
      "Full-speed decision-making",
      "Match integration: hunt isolations",
    ],
    sessions: [
      { day: 1, title: "First-Step Ignition", focus: "SPEED", drills: ["wall-accel", "resisted-sprint", "bounding", "pro-agility"] },
      { day: 2, title: "1v1 Lab", focus: "TECHNICAL", drills: ["takeon-moves", "dribble-slalom", "finishing-both-posts", "cutback-crossing"] },
      { day: 4, title: "Power Base", focus: "STRENGTH", drills: ["trap-bar-deadlift", "hip-thrust", "nordic-curl", "single-leg-rdl"] },
      { day: 6, title: "Transition Engine", focus: "CONDITIONING", drills: ["repeat-sprints", "hill-sprint", "pressing-triggers", "video-study"] },
    ],
  },
  {
    slug: "rodri-system",
    proSlug: "rodri",
    title: "The Rodri System: 8-Week Midfield Controller Program",
    description:
      "Install the scanning operating system, press-proof retention, and positional discipline of an elite holding midfielder. Four sessions a week: a scanning OS module, a retention lab, a foundation strength block, and a midfield engine builder.",
    priceCents: 4900,
    targets: ["scanning", "tempoControl", "defensivePositioning"],
    weeklyThemes: [
      "The scan becomes automatic",
      "Receive on the half-turn, always",
      "Retention under real pressure",
      "Positioning: be there before the danger",
      "Tempo: you set the game's pulse",
      "One-touch solutions under fatigue",
      "Everything at match intensity",
      "Run the game this weekend",
    ],
    sessions: [
      { day: 1, title: "Scanning OS", focus: "TACTICAL", drills: ["scanning-reps", "receive-half-turn", "rondo", "video-study"] },
      { day: 2, title: "Retention Lab", focus: "TECHNICAL", drills: ["shield-pressure", "wall-weak-foot", "driven-pass-ladder", "switch-long-balls"] },
      { day: 4, title: "Foundation Strength", focus: "STRENGTH", drills: ["trap-bar-deadlift", "copenhagen-plank", "hip-thrust", "weighted-step-up"] },
      { day: 6, title: "Midfield Engine", focus: "CONDITIONING", drills: ["30-15", "aerobic-base", "shuttle-pyramid", "positioning-walkthrough"] },
    ],
  },
];
