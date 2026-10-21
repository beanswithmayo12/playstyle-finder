"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { METRIC_KEYS, type MetricKey, type MetricVector, type PositionGroup } from "@/lib/metrics";
import {
  BUILD_FLOOR,
  BUILD_MAX,
  buildOverall,
  buildRemaining,
  defaultBuild,
} from "@/lib/build";
import { METRIC_LABELS } from "./metric-labels";
import { RadarCompare } from "./radar-compare";

interface BuildMatch {
  knownAs: string;
  archetype: string;
  tagline: string;
  matchPercent: number;
}

export function BuildEditor({
  position,
  quizMetrics,
  savedBuild,
}: {
  position: PositionGroup;
  quizMetrics: MetricVector;
  savedBuild: MetricVector | null;
}) {
  const [build, setBuild] = useState<MetricVector>(savedBuild ?? defaultBuild());
  const [matches, setMatches] = useState<BuildMatch[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const remaining = buildRemaining(build);
  const overall = useMemo(() => buildOverall(build, position), [build, position]);

  function setStat(key: MetricKey, raw: number) {
    setMatches(null); // edits invalidate the last result
    const clampedByRules = Math.max(BUILD_FLOOR, Math.min(BUILD_MAX, raw));
    // Budget clamp: you can only raise a stat as far as the pool allows.
    const headroom = buildRemaining(build) + build[key];
    setBuild({ ...build, [key]: Math.min(clampedByRules, headroom) });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: build }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "could not save build");
      setMatches(data.matches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const gaps = METRIC_KEYS.map((k) => ({ key: k, diff: build[k] - quizMetrics[k] }))
    .filter((g) => g.diff > 5)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl display">Build your player</h1>
          <p className="mt-1 text-soft">
            Spend your attribute points like a 2K build — max your signature
            stats, live with the tradeoffs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cobalt/40 bg-cobalt/10 px-5 py-3 text-center">
            <p className="text-3xl display text-cobalt">{overall}</p>
            <p className="text-xs uppercase tracking-widest text-soft">OVR</p>
          </div>
          <div className="rounded-xl border border-rule px-5 py-3 text-center">
            <p className={`text-3xl display ${remaining === 0 ? "text-soft" : "text-ink"}`}>
              {remaining}
            </p>
            <p className="text-xs uppercase tracking-widest text-soft">Points left</p>
          </div>
        </div>
      </div>

      {/* Attribute sliders */}
      <div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {METRIC_KEYS.map((k) => {
          const val = build[k];
          const diff = val - quizMetrics[k];
          return (
            <div key={k}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink-2">{METRIC_LABELS[k]}</span>
                <span className="text-sm">
                  <span className={`font-bold ${val >= 90 ? "text-cobalt" : "text-ink"}`}>{val}</span>
                  <span className={`ml-2 text-xs ${diff >= 0 ? "text-cobalt" : "text-bad"}`}>
                    {diff >= 0 ? "+" : ""}{diff} vs you
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={BUILD_FLOOR}
                max={BUILD_MAX}
                value={val}
                onChange={(e) => setStat(k, Number(e.target.value))}
                className="mt-1 w-full accent-cobalt"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-cobalt px-8 py-3 font-semibold text-on-cobalt transition hover:bg-cobalt-hover disabled:opacity-50"
        >
          {saving ? "Matching your build…" : "Lock in build → find my pro comps"}
        </button>
        <button
          onClick={() => { setBuild(defaultBuild()); setMatches(null); }}
          className="text-sm text-soft underline hover:text-cobalt"
        >
          Reset
        </button>
        {error && <span className="text-sm text-bad">{error}</span>}
      </div>

      {matches && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Pros who play like your {overall} OVR build</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {matches.map((m, i) => (
              <div
                key={m.knownAs}
                className={`rounded-xl border p-5 ${i === 0 ? "border-cobalt/50 bg-cobalt/5" : "border-rule bg-surface"}`}
              >
                <p className="text-2xl display text-cobalt">{m.matchPercent}%</p>
                <p className="mt-1 font-bold">{m.knownAs}</p>
                <p className="text-sm text-soft">{m.archetype}</p>
                <p className="mt-2 text-xs italic text-soft">&ldquo;{m.tagline}&rdquo;</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-rule bg-surface p-6">
            <h3 className="mb-2 font-bold">You today vs. your build</h3>
            <RadarCompare athlete={quizMetrics} pro={build} proName={`Your ${overall} OVR build`} />
          </div>

          {gaps.length > 0 && (
            <div className="mt-6 rounded-2xl border border-cobalt/30 bg-cobalt/5 p-6">
              <h3 className="font-bold">The road from you to your build runs through:</h3>
              <p className="mt-2 text-ink-2">
                {gaps.map((g) => `${METRIC_LABELS[g.key]} (+${g.diff})`).join(" · ")}
              </p>
              <p className="mt-3 text-sm text-soft">
                That&apos;s exactly what an 8-week pro program trains.
              </p>
              <Link
                href="/plans"
                className="mt-4 inline-block rounded-lg bg-cobalt px-6 py-3 font-semibold text-on-cobalt transition hover:bg-cobalt-hover"
              >
                Close the gap →
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
