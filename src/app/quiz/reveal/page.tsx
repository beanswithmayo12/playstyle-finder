"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignUp, useUser } from "@clerk/nextjs";
import { QUIZ_STORAGE_KEY } from "@/data/quiz";

const ANALYZING_LINES = [
  "Scoring your tactical profile…",
  "Comparing you against 36 professional playstyles…",
  "Weighing what defines your position…",
  "Writing your scouting report…",
];

// The capture-at-peak-curiosity step (docs/05): analysis answers are ready,
// the match is one sign-up away. Signed-in users skip straight to analysis.
export default function RevealPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [lineIdx, setLineIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [errorDetail, setErrorDetail] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (status !== "analyzing") return;
    const t = setInterval(() => setLineIdx((i) => (i + 1) % ANALYZING_LINES.length), 2500);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || started.current) return;
    const raw = sessionStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) {
      router.replace("/quiz");
      return;
    }
    started.current = true;
    setStatus("analyzing");

    (async () => {
      try {
        const res = await fetch("/api/analyze/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: raw,
        });
        if (!res.ok) {
          const body = await res.text();
          let msg = body.slice(0, 300);
          try {
            msg = JSON.parse(body).error ?? msg;
          } catch {}
          throw new Error(msg);
        }
        sessionStorage.removeItem(QUIZ_STORAGE_KEY);
        router.replace("/dashboard?reveal=1");
      } catch (e) {
        started.current = false;
        setErrorDetail(e instanceof Error ? e.message.slice(0, 300) : "unknown error");
        setStatus("error");
      }
    })();
  }, [isLoaded, isSignedIn, router, attempt]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-50">
      {!isLoaded ? null : !isSignedIn ? (
        <div className="flex flex-col items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold">Your analysis is ready to run.</h1>
            <p className="mt-3 max-w-md text-zinc-400">
              Create your free account and we&apos;ll reveal which professional
              player your game matches — plus the full tactical breakdown.
            </p>
          </div>
          <SignUp routing="hash" forceRedirectUrl="/quiz/reveal" />
        </div>
      ) : status === "error" ? (
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Something went wrong.</h1>
          <p className="text-zinc-400">Your answers are safe — let&apos;s try that again.</p>
          {errorDetail && (
            <p className="max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-300">
              {errorDetail}
            </p>
          )}
          <button
            onClick={() => {
              setStatus("idle");
              started.current = false;
              setAttempt((a) => a + 1); // re-arms the analysis effect
            }}
            className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Retry analysis
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
          <h1 className="text-2xl font-bold">Analyzing your game…</h1>
          <p className="text-zinc-400 transition-opacity">{ANALYZING_LINES[lineIdx]}</p>
        </div>
      )}
    </main>
  );
}
