"use client";

import { useMemo, useState } from "react";

export interface SessionBlockData {
  name: string;
  focus: string;
  sets: number;
  reps: string;
  cues: string[];
  videoQuery: string;
}

export interface SessionData {
  id: string;
  week: number;
  day: number;
  title: string;
  focus: string;
  content: {
    phase: string;
    theme: string;
    phaseNote: string;
    blocks: SessionBlockData[];
  };
  completed: boolean;
}

export function ProgramView({
  title,
  proName,
  weeks,
  sessions,
  justPurchased,
}: {
  title: string;
  proName: string;
  weeks: number;
  sessions: SessionData[];
  justPurchased: boolean;
}) {
  const [done, setDone] = useState<Set<string>>(
    () => new Set(sessions.filter((s) => s.completed).map((s) => s.id)),
  );
  // Default to the first week with unfinished work — "resume where you left off".
  const [week, setWeek] = useState(() => {
    const firstOpen = sessions.find((s) => !s.completed);
    return firstOpen?.week ?? 1;
  });
  const [open, setOpen] = useState<string | null>(null);

  const weekSessions = useMemo(
    () => sessions.filter((s) => s.week === week),
    [sessions, week],
  );
  const progress = Math.round((done.size / sessions.length) * 100);
  const weekTheme = weekSessions[0]?.content.theme;

  async function toggle(sessionId: string) {
    // Optimistic flip; revert on failure.
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => null);
    if (!res?.ok) {
      setDone((prev) => {
        const next = new Set(prev);
        if (next.has(sessionId)) next.delete(sessionId);
        else next.add(sessionId);
        return next;
      });
    }
  }

  return (
    <div>
      {justPurchased && (
        <div className="mt-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          You&apos;re in. Eight weeks from now your game looks different — start with Week 1, Day 1.
        </div>
      )}

      <h1 className="mt-6 text-3xl font-black">{title}</h1>
      <p className="mt-1 text-zinc-400">Modeled on {proName}&apos;s athletic and tactical profile</p>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-semibold text-emerald-400">{progress}%</span>
      </div>

      {/* Week navigator */}
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => {
          const wSessions = sessions.filter((s) => s.week === w);
          const wDone = wSessions.every((s) => done.has(s.id));
          return (
            <button
              key={w}
              onClick={() => setWeek(w)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                w === week
                  ? "bg-emerald-500 text-zinc-950"
                  : wDone
                    ? "border border-emerald-500/40 text-emerald-400"
                    : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              W{w}{wDone ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      {weekTheme && (
        <p className="mt-4 text-sm uppercase tracking-widest text-zinc-500">
          Week {week}: {weekTheme}
        </p>
      )}

      {/* Sessions */}
      <div className="mt-4 space-y-3">
        {weekSessions.map((s) => {
          const isOpen = open === s.id;
          const isDone = done.has(s.id);
          return (
            <div key={s.id} className={`rounded-xl border ${isDone ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggle(s.id)}
                  aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                    isDone ? "border-emerald-500 bg-emerald-500 text-zinc-950" : "border-zinc-600 hover:border-emerald-500"
                  }`}
                >
                  {isDone ? "✓" : ""}
                </button>
                <button onClick={() => setOpen(isOpen ? null : s.id)} className="flex flex-1 items-center justify-between text-left">
                  <div>
                    <p className={`font-semibold ${isDone ? "text-zinc-400 line-through" : ""}`}>
                      Day {s.day}: {s.title}
                    </p>
                    <p className="text-xs text-zinc-500">{s.focus} · {s.content.blocks.length} drills</p>
                  </div>
                  <span className="text-zinc-500">{isOpen ? "▴" : "▾"}</span>
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-zinc-800 p-4">
                  <p className="mb-4 text-sm italic text-zinc-400">{s.content.phaseNote}</p>
                  <ol className="space-y-4">
                    {s.content.blocks.map((b, i) => (
                      <li key={i} className="rounded-lg bg-zinc-950/60 p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-semibold text-zinc-100">
                            {i + 1}. {b.name}
                          </p>
                          <p className="shrink-0 text-sm font-semibold text-emerald-400">
                            {b.sets} × {b.reps}
                          </p>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                          {b.cues.map((c) => (
                            <li key={c}>• {c}</li>
                          ))}
                        </ul>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(b.videoQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-zinc-500 underline hover:text-zinc-300"
                        >
                          ▶ Watch technique reference
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
