"use client";

import { useMemo, useState } from "react";

export interface SessionBlockData {
  kind?: "drill" | "habit";
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
  track: "SOLO" | "TEAM";
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
  const [track, setTrack] = useState<"SOLO" | "TEAM">("SOLO");
  // Default to the first week with unfinished solo work — "resume where you left off".
  const [week, setWeek] = useState(() => {
    const firstOpen = sessions.find((s) => s.track === "SOLO" && !s.completed);
    return firstOpen?.week ?? 1;
  });
  const [open, setOpen] = useState<string | null>(null);

  const trackSessions = useMemo(() => sessions.filter((s) => s.track === track), [sessions, track]);
  const weekSessions = useMemo(
    () => trackSessions.filter((s) => s.week === week),
    [trackSessions, week],
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
        <div className="mt-2 rounded-xl border border-cobalt/40 bg-cobalt/10 p-4 text-sm text-cobalt">
          You&apos;re in. Eight weeks from now your game looks different — start with Week 1, Day 1.
        </div>
      )}

      <h1 className="mt-6 text-3xl display">{title}</h1>
      <p className="mt-1 text-soft">Modeled on {proName}&apos;s athletic and tactical profile</p>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
          <div className="h-2 rounded-full bg-cobalt transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-semibold text-cobalt">{progress}%</span>
      </div>

      {/* Solo vs team-practice tracks */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-rule bg-surface p-1">
        {([
          ["SOLO", "On your own", "Sessions to do by yourself"],
          ["TEAM", "At team practice", "Habits to bring to practice"],
        ] as const).map(([value, label, sub]) => (
          <button
            key={value}
            onClick={() => {
              setTrack(value);
              setOpen(null);
            }}
            className={`rounded-lg px-4 py-3 text-left transition ${
              track === value ? "bg-track text-ink" : "text-soft hover:text-cobalt"
            }`}
          >
            <span className="block text-sm font-semibold">{label}</span>
            <span className="block text-xs text-soft">{sub}</span>
          </button>
        ))}
      </div>

      {/* Week navigator */}
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => {
          const wSessions = trackSessions.filter((s) => s.week === w);
          const wDone = wSessions.length > 0 && wSessions.every((s) => done.has(s.id));
          return (
            <button
              key={w}
              onClick={() => setWeek(w)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                w === week
                  ? "bg-cobalt text-on-cobalt"
                  : wDone
                    ? "border border-cobalt/40 text-cobalt"
                    : "border border-rule text-ink-2 hover:border-cobalt"
              }`}
            >
              W{w}{wDone ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      {weekTheme && (
        <p className="mt-4 text-sm uppercase tracking-widest text-soft">
          Week {week}: {weekTheme}
        </p>
      )}

      {/* Sessions */}
      <div className="mt-4 space-y-3">
        {weekSessions.length === 0 && (
          <p className="rounded-xl border border-rule p-4 text-sm text-soft">
            Nothing here yet for this week.
          </p>
        )}
        {weekSessions.map((s) => {
          const isOpen = open === s.id;
          const isDone = done.has(s.id);
          return (
            <div key={s.id} className={`rounded-xl border ${isDone ? "border-cobalt/40 bg-cobalt/5" : "border-rule bg-surface"}`}>
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggle(s.id)}
                  aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                    isDone ? "border-cobalt bg-cobalt text-on-cobalt" : "border-rule hover:border-cobalt"
                  }`}
                >
                  {isDone ? "✓" : ""}
                </button>
                <button onClick={() => setOpen(isOpen ? null : s.id)} className="flex flex-1 items-center justify-between text-left">
                  <div>
                    <p className={`font-semibold ${isDone ? "text-soft line-through" : ""}`}>
                      {s.track === "TEAM" ? s.title : `Day ${s.day}: ${s.title}`}
                    </p>
                    <p className="text-xs text-soft">
                      {s.track === "TEAM"
                        ? `${s.content.blocks.length} challenges · check off when you've done them all`
                        : `${s.focus} · ${s.content.blocks.length} drills`}
                    </p>
                  </div>
                  <span className="text-soft">{isOpen ? "▴" : "▾"}</span>
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-rule p-4">
                  <p className="mb-4 text-sm italic text-soft">{s.content.phaseNote}</p>
                  <ol className="space-y-4">
                    {s.content.blocks.map((b, i) => (
                      <li key={i} className="rounded-lg bg-paper p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-semibold text-ink">
                            {i + 1}. {b.name}
                          </p>
                          <p className="shrink-0 text-sm font-semibold text-cobalt">
                            {b.kind === "habit" ? b.reps : `${b.sets} × ${b.reps}`}
                          </p>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-soft">
                          {b.cues.map((c) => (
                            <li key={c}>• {c}</li>
                          ))}
                        </ul>
                        {b.videoQuery && (
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(b.videoQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-xs text-soft underline hover:text-cobalt"
                          >
                            ▶ Watch technique reference
                          </a>
                        )}
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
