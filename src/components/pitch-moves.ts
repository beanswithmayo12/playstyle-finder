import type { MetricKey } from "@/lib/metrics";

/**
 * How each tendency looks on the pitch (flair 5). Metres on a 105 × 68 pitch,
 * attacking left → right, drawn for a player on the left flank.
 */
export interface PitchMove {
  /** Run or dribble, drawn as a solid line. */
  carry?: string;
  /** Pass or shot, drawn dashed. */
  pass?: string;
  /** Path the ball travels. */
  ball: string;
  /** Where the ball comes to rest (used when motion is reduced). */
  end: [number, number];
  /** An opponent, marked with an ×. */
  opponent?: [number, number];
}

export const PITCH_MOVES: Record<MetricKey, PitchMove> = {
  dribbleDensity: {
    carry: "M70 13 C 78 20, 85 18, 92 10",
    ball: "M70 13 C 78 20, 85 18, 92 10",
    end: [92, 10],
    opponent: [83, 13],
  },
  explosiveness: { carry: "M54 6 L 94 6", ball: "M54 6 L 94 6", end: [94, 6] },
  verticalProgression: {
    pass: "M60 17 L 86 33",
    carry: "M86 33 L 95 37",
    ball: "M60 17 L 86 33 L 95 37",
    end: [95, 37],
  },
  finishingInstinct: {
    carry: "M80 22 C 86 27, 90 31, 93 34",
    pass: "M93 34 L 105 34",
    ball: "M80 22 C 86 27, 90 31, 93 34 L 105 34",
    end: [105, 34],
  },
  spatialCreation: {
    carry: "M72 8 C 74 16, 76 22, 80 26",
    pass: "M58 44 L 79 27",
    ball: "M58 44 L 79 27",
    end: [79, 27],
  },
  passingRange: { pass: "M48 22 Q 70 30, 86 60", ball: "M48 22 Q 70 30, 86 60", end: [86, 60] },
  tempoControl: {
    pass: "M45 30 L 55 22 L 58 36 L 66 28",
    ball: "M45 30 L 55 22 L 58 36 L 66 28",
    end: [66, 28],
  },
  scanning: {
    pass: "M58 24 L 50 15 M58 24 L 50 33",
    carry: "M58 24 L 72 24",
    ball: "M46 32 L 58 24 L 72 24",
    end: [72, 24],
  },
  pressingIntensity: {
    carry: "M64 28 C 70 28, 75 32, 78 35",
    ball: "M86 42 L 80 37",
    end: [80, 37],
    opponent: [81, 38],
  },
  defensivePositioning: {
    carry: "M52 18 C 46 22, 41 26, 38 29",
    pass: "M54 50 L 38 29",
    ball: "M54 50 L 38 29",
    end: [38, 29],
  },
  duelAggression: { carry: "M62 24 L 70 29", ball: "M76 34 L 71 30", end: [71, 30], opponent: [73, 31] },
  endurance: {
    carry: "M20 30 C 40 16, 60 44, 88 28",
    ball: "M20 30 C 40 16, 60 44, 88 28",
    end: [88, 28],
  },
};

/** Mirror a path onto the right flank (y → 68 − y). Paths use absolute "x y" pairs. */
export function mirrorPath(d: string): string {
  return d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${x} ${68 - Number(y)}`);
}
