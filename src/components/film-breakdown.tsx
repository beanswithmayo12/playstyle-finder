import type { FilmMoment, FilmStat } from "@/lib/film-stats";
import { KeyMoments } from "./key-moments";

/** Stat tiles over the full key-moments panel (film page, recruiting profile). */
export function FilmBreakdown({
  stats,
  moments,
  videoUrl,
}: {
  stats: FilmStat[];
  moments: FilmMoment[];
  videoUrl: string | null;
}) {
  return (
    <div className="space-y-5">
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.type} className="card p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {s.made !== null ? (
                  <>
                    <span className="text-cobalt">{s.made}</span>
                    <span className="text-faint">/{s.count}</span>
                  </>
                ) : (
                  s.count
                )}
              </p>
              <p className="mt-1 font-mono text-[11px] tracking-[0.08em] text-soft uppercase">
                {s.label}
                {s.made !== null && " made"}
              </p>
            </div>
          ))}
        </div>
      )}
      {moments.length > 0 && <KeyMoments moments={moments} videoUrl={videoUrl} filters />}
    </div>
  );
}
