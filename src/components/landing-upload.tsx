"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { savePendingReel } from "@/lib/pending-reel";
import { VideoDropzone } from "./video-dropzone";

const YOUTUBE_RE = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{6,}/i;

export function LandingUpload() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [linkMsg, setLinkMsg] = useState<{ kind: "youtube" | "invalid" } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFile(file: File) {
    setSaving(true);
    // If IndexedDB is unavailable the upload page simply asks for the file again.
    await savePendingReel(file);
    router.push("/upload");
  }

  function handleLink(e: React.FormEvent) {
    e.preventDefault();
    const url = link.trim();
    if (!url) return;
    setLinkMsg({ kind: YOUTUBE_RE.test(url) ? "youtube" : "invalid" });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {saving ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 px-6 py-14">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
          <p className="mt-4 font-semibold">Getting your reel ready…</p>
        </div>
      ) : (
        <VideoDropzone onFile={handleFile} />
      )}

      <form onSubmit={handleLink} className="mt-4 flex gap-2">
        <input
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setLinkMsg(null);
          }}
          placeholder="…or paste a YouTube link"
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-emerald-500"
        >
          Use link
        </button>
      </form>

      {linkMsg?.kind === "youtube" && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-sm text-amber-200">
          We can&apos;t pull videos straight from YouTube yet — YouTube doesn&apos;t
          allow other sites to download them. If it&apos;s your video, download it in{" "}
          <a
            href="https://support.google.com/youtube/answer/56100"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            YouTube Studio
          </a>{" "}
          (Content → ⋮ → Download) and drop the file above.
        </div>
      )}
      {linkMsg?.kind === "invalid" && (
        <p className="mt-3 text-sm text-red-400">
          That doesn&apos;t look like a YouTube link — try a youtube.com or youtu.be URL.
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm text-zinc-500">No highlights yet?</p>
        <Link
          href="/quiz"
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-semibold text-zinc-100 transition hover:border-emerald-500"
        >
          Take the 3-minute quiz instead →
        </Link>
      </div>
    </div>
  );
}
