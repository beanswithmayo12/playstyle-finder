"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignUp, useUser } from "@clerk/nextjs";
import { QUIZ_STORAGE_KEY } from "@/data/quiz";
import { SiteHeader } from "@/components/site-header";

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
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 text-center text-ink">
        {!isLoaded ? null : !isSignedIn ? (
          <div className="flex flex-col items-center gap-6">
            <div>
              <h1 className="display text-4xl">Your analysis is ready to run.</h1>
              <p className="mt-3 max-w-md text-soft">
                Create your free account and we&apos;ll reveal which professional
                player your game matches — plus the full tactical breakdown.
              </p>
            </div>
            <SignUp routing="hash" forceRedirectUrl="/quiz/reveal" />
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center gap-4">
            <h1 className="display text-3xl">Something went wrong.</h1>
            <p className="text-soft">Your answers are safe — let&apos;s try that again.</p>
            {errorDetail && (
              <p className="max-w-md rounded-lg border border-bad/30 bg-bad/10 p-3 font-mono text-xs text-bad">
                {errorDetail}
              </p>
            )}
            <button
              onClick={() => {
                setStatus("idle");
                started.current = false;
                setAttempt((a) => a + 1); // re-arms the analysis effect
              }}
              className="rounded-lg bg-cobalt px-6 py-3 font-semibold text-on-cobalt transition hover:bg-cobalt-hover"
            >
              Retry analysis
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-rule border-t-cobalt" />
            <h1 className="display text-3xl">Analyzing your game…</h1>
            <p className="text-soft transition-opacity">{ANALYZING_LINES[lineIdx]}</p>
          </div>
        )}
      </main>
    </>
  );
}
