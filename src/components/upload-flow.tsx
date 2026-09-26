"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { POSITION_OPTIONS } from "@/data/quiz";
import { clearPendingReel, loadPendingReel } from "@/lib/pending-reel";
import { VideoDropzone, reelContentType } from "./video-dropzone";

type Stage = "form" | "uploading" | "analyzing" | "error";

const ANALYZING_LINES = [
  "Pulling frames from your reel…",
  "Finding you on film (jersey check)…",
  "Logging take-ons, passes, and pressing actions…",
  "Scoring your 12 attributes…",
  "Matching you against the pros…",
];

export function UploadFlow({
  signedIn,
  initialPosition,
}: {
  signedIn: boolean;
  initialPosition: string | null;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("form");
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState(initialPosition ?? "");
  const [jerseyColor, setJerseyColor] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick up a reel dropped on the landing page.
  useEffect(() => {
    loadPendingReel().then((f) => f && setFile(f));
  }, []);

  useEffect(() => {
    if (stage !== "analyzing") return;
    const t = setInterval(() => setLineIdx((i) => (i + 1) % ANALYZING_LINES.length), 4000);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    [],
  );

  const ready = !!file && !!position && !!jerseyColor.trim() && !!jerseyNumber.trim();

  async function start() {
    if (!file || !ready) return;
    const contentType = reelContentType(file);
    if (!contentType) {
      setError("That file isn't a video we can read — use an mp4, mov, or webm.");
      return;
    }
    setError("");
    setStage("uploading");
    try {
      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, sizeBytes: file.size }),
      });
      const presignData = await presign.json();
      if (!presign.ok) throw new Error(presignData.error ?? "upload setup failed");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignData.uploadUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) =>
          e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`upload failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("upload failed — check your connection"));
        xhr.send(file);
      });
      await clearPendingReel();

      const analyze = await fetch("/api/analyze/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoKey: presignData.videoKey,
          jerseyColor,
          jerseyNumber,
          positionGroup: position,
        }),
      });
      const analyzeData = await analyze.json();
      if (!analyze.ok) throw new Error(analyzeData.error ?? "could not start analysis");

      setStage("analyzing");
      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/assessments/${analyzeData.assessmentId}`).catch(() => null);
        if (!res?.ok) return;
        const { status } = await res.json();
        if (status === "COMPLETE") {
          if (pollRef.current) clearInterval(pollRef.current);
          router.replace("/dashboard?reveal=1");
        } else if (status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setError("Analysis failed — the footage may be too unclear. Try a different reel.");
          setStage("error");
        }
      }, 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
      setStage("error");
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-semibold text-zinc-300">
          ⚽ Playstyle Finder
        </Link>
        {signedIn && (
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
            Dashboard
          </Link>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-16">
        {!signedIn ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <div>
              <h1 className="text-3xl font-bold">Your film is ready to scout.</h1>
              <p className="mt-3 text-zinc-400">
                Create your free account and we&apos;ll analyze your reel and reveal
                which professional player your game matches.
              </p>
            </div>
            <SignUp routing="hash" forceRedirectUrl="/upload" signInForceRedirectUrl="/upload" />
          </div>
        ) : stage === "form" || stage === "error" ? (
          <>
            <h1 className="text-3xl font-bold">Scout my film</h1>
            <p className="mt-3 text-zinc-400">
              Tell us where you play and how to spot you, and we&apos;ll do the rest.
            </p>

            <div className="mt-8 space-y-5">
              {file ? (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">🎬 {file.name}</p>
                    <p className="text-sm text-zinc-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      clearPendingReel();
                    }}
                    className="shrink-0 text-sm text-zinc-400 underline hover:text-zinc-200"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <VideoDropzone onFile={setFile} compact />
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Your position</span>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Where do you play most often?
                  </option>
                  {POSITION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Jersey color</span>
                  <input
                    value={jerseyColor}
                    onChange={(e) => setJerseyColor(e.target.value)}
                    placeholder="e.g. red with white stripes"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Jersey number</span>
                  <input
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </label>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                onClick={start}
                disabled={!ready}
                className="w-full rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
              >
                Upload &amp; analyze my film
              </button>
              <p className="text-center text-sm text-zinc-500">
                No highlights?{" "}
                <Link href="/quiz" className="text-zinc-300 underline hover:text-zinc-100">
                  Take the 3-minute quiz instead
                </Link>
              </p>
            </div>
          </>
        ) : stage === "uploading" ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Uploading your reel…</h1>
            <div className="mx-auto mt-6 h-2 w-full max-w-sm overflow-hidden rounded-full bg-zinc-800">
              <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-sm text-zinc-500">{progress}% — keep this tab open</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
            <h1 className="mt-6 text-2xl font-bold">Analyzing your film…</h1>
            <p className="mt-2 text-zinc-400">{ANALYZING_LINES[lineIdx]}</p>
            <p className="mt-6 text-sm text-zinc-600">
              This takes a minute or two. You&apos;ll land on your match automatically.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
