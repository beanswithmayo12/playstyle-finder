/**
 * Team-practice track: things to TRY at team practice, as opposed to the
 * solo sessions an athlete does on their own. These add no extra training
 * load — they change how the athlete uses practice they already attend.
 *
 * Keyed by metric so both the free weekly card (driven by the athlete's
 * biggest gaps) and the paid programs (driven by the program's targets)
 * draw from one library.
 */

import { METRIC_KEYS, type MetricKey } from "@/lib/metrics";
import type { GeneratedSession, ProgramDef } from "./programs";

export interface PracticeHabit {
  title: string;
  detail: string;
}

export const PRACTICE_HABITS: Record<MetricKey, PracticeHabit[]> = {
  verticalProgression: [
    { title: "Look forward first", detail: "Before any sideways pass in scrimmage, check whether a forward pass or carry is on. If it is, take it." },
    { title: "Count your forward plays", detail: "Keep a mental tally of forward passes and carries in scrimmage. Beat it next practice." },
  ],
  dribbleDensity: [
    { title: "Three take-ons minimum", detail: "Take on your defender at least three times every scrimmage. Losing the ball is allowed; hiding isn't." },
    { title: "Both feet in every dribbling drill", detail: "Alternate feet on every rep of cone and 1v1 drills, even when it feels slower." },
  ],
  spatialCreation: [
    { title: "Pass and move", detail: "After every pass, move somewhere new. Never stand where you just passed from." },
    { title: "Find the pocket", detail: "When your team has the ball, look for the gap between the opponent's midfield and defense and stand in it." },
  ],
  finishingInstinct: [
    { title: "Shoot when you see goal", detail: "In scrimmage, if you have a clear sight of goal, shoot. No extra pass." },
    { title: "Ten extra finishes", detail: "Stay five minutes after practice for ten finishes, alternating feet and corners." },
  ],
  passingRange: [
    { title: "One switch per scrimmage", detail: "Hit at least one long switch of play to the far side every scrimmage." },
    { title: "Weak-foot warm-up", detail: "In warm-up passing, use your weaker foot for every second pass." },
  ],
  tempoControl: [
    { title: "You set the rhythm in rondos", detail: "Choose on purpose: two touches to slow the rondo down, one touch to speed it up." },
    { title: "Name the tempo", detail: "Before you receive in scrimmage, decide 'slow it down' or 'go' — then play that way." },
  ],
  pressingIntensity: [
    { title: "Five-second press", detail: "When your team loses the ball in scrimmage, sprint at it for five seconds before you drop off." },
    { title: "Curve your press", detail: "When you press, bend your run to block one passing lane at the same time." },
  ],
  defensivePositioning: [
    { title: "Check your shape", detail: "When the ball is on the far side, glance at your nearest attacker and fix your distance before it comes back." },
    { title: "Talk the line", detail: "Call out one instruction to a teammate every defensive phase ('step', 'drop', 'man on')." },
  ],
  duelAggression: [
    { title: "Win the first 50/50", detail: "Go hard into the first loose ball of every scrimmage. Set the tone early." },
    { title: "Arm out, body in", detail: "In shielding and 1v1 drills, get your body between the ball and your opponent before it arrives." },
  ],
  explosiveness: [
    { title: "First three steps at max", detail: "In every drill that starts with a run, make the first three steps full effort." },
    { title: "Win every race", detail: "Treat each race to a loose ball in warm-ups as a sprint you have to win." },
  ],
  endurance: [
    { title: "Never walk in scrimmage", detail: "Jogging is the slowest you move once scrimmage starts." },
    { title: "First back after water", detail: "Be first back on the field after every water break." },
  ],
  scanning: [
    { title: "Two shoulder checks", detail: "Check over your shoulder twice before every reception in drills and scrimmage." },
    { title: "Call what you see", detail: "In rondos, say one thing you saw ('man on', 'turn') before the ball reaches you." },
  ],
};

/** Athletic habits worth building regardless of position or pro match. */
export const GENERAL_HABITS: PracticeHabit[] = [
  { title: "Arrive early to warm up", detail: "Get there ten minutes early for a dynamic warm-up: leg swings, skips, lunges, short sprints." },
  { title: "Cool down after", detail: "Take five minutes after practice to walk it off and stretch your hips, hamstrings and calves." },
  { title: "Bring water, drink often", detail: "Bring a full bottle and drink at every break, not just when you're thirsty." },
  { title: "Protect your sleep", detail: "Aim for 8–10 hours on training nights — most recovery happens while you sleep." },
  { title: "One-line practice log", detail: "After practice, write one sentence: what went well and one thing to try next time." },
];

/** Week number since the Unix epoch, so free habits rotate weekly. */
export function currentWeekIndex(now = new Date()): number {
  return Math.floor(now.getTime() / (7 * 24 * 3600 * 1000));
}

/**
 * The free "at team practice this week" card: one habit for each of the
 * athlete's biggest gaps, plus one general athletic habit, rotating weekly.
 */
export function weeklyPracticeFocus(
  gapKeys: MetricKey[],
  weekIndex = currentWeekIndex(),
): { metric: MetricKey | null; habit: PracticeHabit }[] {
  const picks = gapKeys.slice(0, 3).map((k) => {
    const options = PRACTICE_HABITS[k];
    return { metric: k, habit: options[weekIndex % options.length] };
  });
  return [
    ...picks,
    { metric: null, habit: GENERAL_HABITS[weekIndex % GENERAL_HABITS.length] },
  ];
}

export interface TeamPracticeWeek {
  week: number;
  title: string;
  habits: PracticeHabit[];
}

/**
 * The paid program's team-practice track: one guide per week built from the
 * program's target metrics, rotating habits so each week is different.
 */
export function buildTeamPracticeWeeks(def: ProgramDef): TeamPracticeWeek[] {
  const targets = def.targets.filter((t): t is MetricKey =>
    (METRIC_KEYS as readonly string[]).includes(t),
  );
  return Array.from({ length: 8 }, (_, i) => {
    const week = i + 1;
    const habits = targets.map((k) => {
      const options = PRACTICE_HABITS[k];
      return options[i % options.length];
    });
    habits.push(GENERAL_HABITS[i % GENERAL_HABITS.length]);
    return { week, title: `At team practice — week ${week}`, habits };
  });
}

/** Team-track rows for PlanSession (one per week, day 0, track TEAM). */
export function buildTeamPracticeSessions(def: ProgramDef): GeneratedSession[] {
  return buildTeamPracticeWeeks(def).map((w) => ({
    week: w.week,
    day: 0,
    title: w.title,
    focus: "TACTICAL",
    content: {
      phase: "Team practice",
      theme: def.weeklyThemes[w.week - 1],
      phaseNote:
        "Bring these into every team practice this week. They add no extra training load — they change how you use the practice you already have.",
      blocks: w.habits.map((h) => ({
        kind: "habit" as const,
        name: h.title,
        focus: "TACTICAL" as const,
        sets: 0,
        reps: "Every practice this week",
        cues: [h.detail],
        videoQuery: "",
      })),
    },
  }));
}
