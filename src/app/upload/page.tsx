"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Stage = "form" | "uploading" | "analyzing" | "error";

const ANALYZING_LINES = [
  "Pulling frames from your reel…",
  "Finding you on film (jersey check)…",
  "Logging take-ons, passes, and pressing actions…",
  "Blending film with your questionnaire…",
  "Re-running your pro match…",
];

export default function UploadPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("form");
  const [file, setFile] = useState<File | null>(null);
  const [jerseyColor, setJerseyColor] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stage !== "analyzing") return;
    const t = setInterval(() => setLineIdx((i) => (i + 1) % ANALYZING_LINES.length), 4000);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function start() {
    if (!file || !jerseyColor.trim() || !jerseyNumber.trim()) return;
    setError("");
    setStage("uploading");
    try {
      // 1. Presign
      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      });
      const presignData = await presign.json();
      if (!presign.ok) throw new Error(presignData.error ?? "upload setup failed");

      // 2. Direct upload to R2 with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignData.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) =>
          e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("upload failed — check your connection"));
        xhr.send(file);
      });

      // 3. Kick off analysis
      const analyze = await fetch("/api/analyze/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoKey: presignData.videoKey, jerseyColor, jerseyNumber }),
      });
      const analyzeData = await analyze.json();
      if (!analyze.ok) throw new Error(analyzeData.error ?? "could not start analysis");

      // 4. Poll until done (worst case a few minutes)
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
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-300">← Your match</Link>
        <span className="text-sm text-zinc-500">⚽ Playstyle Finder</span>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-16">
        {stage === "form" || stage === "error" ? (
          <>
            <h1 className="text-3xl font-bold">Verify your match with game film</h1>
            <p className="mt-3 text-zinc-400">
              Upload a highlight reel (up to ~3 minutes, 250 MB). Our AI reads
              your actions on film and blends them with your questionnaire for a
              film-verified match.
            </p>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Highlight reel</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-semibold file:text-zinc-950"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Your jersey color</span>
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
                disabled={!file || !jerseyColor.trim() || !jerseyNumber.trim()}
                className="w-full rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
              >
                Upload & analyze my film
              </button>
              <p className="text-center text-xs text-zinc-600">
                Tip: highlight reels beat full-match tape — more actions, better analysis.
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
              This takes a few minutes. Your match updates automatically when it&apos;s done.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
