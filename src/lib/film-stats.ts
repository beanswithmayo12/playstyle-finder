/**
 * Turns a film assessment's event log into an athlete-facing stat line and a
 * list of clickable moments. Pure — shared by the film breakdown page, the
 * dashboard card, and the public recruiting profile.
 */

import type { VideoEvent } from "@/lib/ai/video";

export interface StatDef {
  type: string;
  label: string; // stat tile label, plural
  moment: string; // moment list label, singular
  /** Show "made/attempted" instead of a plain count. */
  rated: boolean;
}

// Display order = importance on a stat line.
export const STAT_DEFS: StatDef[] = [
  { type: "take_on", label: "Take-ons", moment: "Take-on", rated: true },
  { type: "shot", label: "Shots", moment: "Shot", rated: true },
  { type: "creative_pass", label: "Key passes", moment: "Key pass", rated: true },
  { type: "progressive_action", label: "Progressive actions", moment: "Progressive action", rated: true },
  { type: "defensive_action", label: "Defensive actions", moment: "Defensive action", rated: true },
  { type: "aerial_or_physical_duel", label: "Duels", moment: "Duel", rated: true },
  { type: "retention_action", label: "Retentions", moment: "Retention", rated: true },
  { type: "off_ball_run", label: "Runs in behind", moment: "Run in behind", rated: false },
  { type: "burst", label: "Bursts", moment: "Burst", rated: false },
  { type: "scan", label: "Scans", moment: "Scan", rated: false },
];

export interface FilmStat {
  type: string;
  label: string;
  count: number;
  /** Successful attempts; null when not rated or no outcomes were judged. */
  made: number | null;
}

export interface FilmMoment {
  t: number; // seconds into the reel
  label: string;
  description: string;
  outcome: VideoEvent["outcome"];
}

export function computeFilmStats(events: VideoEvent[]): FilmStat[] {
  return STAT_DEFS.flatMap((def) => {
    const ofType = events.filter((e) => e.type === def.type);
    if (ofType.length === 0) return [];
    const judged = ofType.filter((e) => e.outcome === "success" || e.outcome === "fail");
    const made =
      def.rated && judged.length > 0 ? ofType.filter((e) => e.outcome === "success").length : null;
    return [{ type: def.type, label: def.label, count: ofType.length, made }];
  });
}

export function filmMoments(events: VideoEvent[]): FilmMoment[] {
  return [...events]
    .sort((a, b) => a.tStart - b.tStart)
    .map((e) => ({
      t: Math.max(0, e.tStart),
      label: STAT_DEFS.find((d) => d.type === e.type)?.moment ?? e.type,
      description: e.description.replace(/^\[Demo\]\s*/, ""),
      outcome: e.outcome,
    }));
}

/** "73" → "1:13". */
export function formatTimestamp(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Headline string like "12 take-ons (8 successful) · 3 shots". */
export function statLine(stats: FilmStat[], max = 3): string {
  return stats
    .slice(0, max)
    .map((s) => {
      const def = STAT_DEFS.find((d) => d.type === s.type);
      const noun = (s.count === 1 && def ? def.moment : s.label).toLowerCase();
      return s.made !== null
        ? `${s.count} ${noun} (${s.made} successful)`
        : `${s.count} ${noun}`;
    })
    .join(" · ");
}
