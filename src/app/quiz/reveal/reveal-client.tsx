"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignUp, useUser } from "@clerk/nextjs";
import { POSITION_OPTIONS, QUIZ_STORAGE_KEY } from "@/data/quiz";
import { FLAIR } from "@/lib/flair";
import { SiteHeader } from "@/components/site-header";
import { SignUpStage, type TeaserMatch } from "@/components/signup-stage";

const ANALYZING_LINES = [
  "Scoring your tactical profile…",
  "Comparing you against 36 professional playstyles…",
  "Weighing what defines your position…",
  "Writing your scouting report…",
];

// The capture-at-peak-curiosity step (docs/05): analysis answers are ready,
// the match is one sign-up away. Signed-in users skip straight to analysis.
export function RevealClient({ proNames }: { proNames: string[] }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [lineIdx, setLineIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [errorDetail, setErrorDetail] = useState("");
  const [position, setPosition] = useState<string | null>(null);
  const [match, setMatch] = useState<TeaserMatch | null>(null);
  const started = useRef(false);

  // Position from the quiz answers, for the locked report's label.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(QUIZ_STORAGE_KEY);
      const value = raw ? (JSON.parse(raw) as { positionGroup?: string }).positionGroup : null;
      setPosition(POSITION_OPTIONS.find((o) => o.value === value)?.label ?? null);
    } catch {
      // No saved answers; the label falls back to "Player".
    }
  }, []);

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
        const body = await res.text();
        if (!res.ok) {
          let msg = body.slice(0, 300);
          try {
            msg = JSON.parse(body).error ?? msg;
          } catch {}
          throw new Error(msg);
        }
        sessionStorage.removeItem(QUIZ_STORAGE_KEY);
        const data = JSON.parse(body) as {
          match: { pro: { knownAs: string; archetype: string }; matchPercent: number };
        };
        // With the locked report on screen, land the shuffle on the match
        // first; the redirect follows once it has landed.
        if (FLAIR.lockedTeaser) {
          setMatch({ name: data.match.pro.knownAs, archetype: data.match.pro.archetype, percent: data.match.matchPercent });
        } else {
          router.replace("/dashboard?reveal=1");
        }
      } catch (e) {
        started.current = false;
        setErrorDetail(e instanceof Error ? e.message.slice(0, 300) : "unknown error");
        setStatus("error");
      }
    })();
  }, [isLoaded, isSignedIn, router, attempt]);

  const teaser = {
    names: proNames,
    position,
    match,
    onLanded: () => setTimeout(() => router.replace("/dashboard?reveal=1"), 1600),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {!isLoaded ? null : !isSignedIn ? (
        <SignUpStage
          steps={["Quiz", "Account", "Your report"]}
          current={1}
          eyebrow={position ? `Quiz complete · ${position}` : "Quiz complete"}
          heading="Your pro twin is one step away."
          lede="Create your free account and we'll reveal which pro plays like you, plus the full breakdown."
          teaser={teaser}
        >
          <SignUp routing="hash" forceRedirectUrl="/quiz/reveal" />
        </SignUpStage>
      ) : status === "error" ? (
        <SignUpStage steps={["Quiz", "Account", "Your report"]} current={2} heading="Something went wrong." lede="Your answers are safe. Let's try that again.">
          {errorDetail && (
            <p className="max-w-md border border-bad/30 bg-bad/10 p-3 font-mono text-xs text-bad">{errorDetail}</p>
          )}
          <button
            onClick={() => {
              setStatus("idle");
              started.current = false;
              setAttempt((a) => a + 1); // re-arms the analysis effect
            }}
            className="btn-primary mt-4"
          >
            Retry analysis
          </button>
        </SignUpStage>
      ) : (
        <SignUpStage
          steps={["Quiz", "Account", "Your report"]}
          current={match ? 3 : 2}
          eyebrow="Account ready"
          heading={match ? "Meet your pro twin." : "Analyzing your game…"}
          lede={match ? "Opening your report…" : ANALYZING_LINES[lineIdx]}
          teaser={teaser}
        >
          {!FLAIR.lockedTeaser && (
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-rule border-t-cobalt" />
          )}
        </SignUpStage>
      )}
    </div>
  );
}
