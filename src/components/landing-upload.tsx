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
  const [linkMsg, setLinkMsg] = useState<"youtube" | "invalid" | null>(null);
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
    setLinkMsg(YOUTUBE_RE.test(url) ? "youtube" : "invalid");
  }

  return (
    <div className="max-w-xl">
      {saving ? (
        <div className="offset-shadow flex items-center gap-4 border-[1.5px] border-cobalt bg-surface px-5 py-5">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-rule border-t-cobalt" />
          <p className="font-semibold">Getting your reel ready…</p>
        </div>
      ) : (
        <VideoDropzone onFile={handleFile} />
      )}

      <form onSubmit={handleLink} className="mt-5 flex gap-2">
        <label htmlFor="reel-link" className="sr-only">YouTube link</label>
        <input
          id="reel-link"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setLinkMsg(null);
          }}
          placeholder="…or paste a YouTube link"
          className="input min-w-0 flex-1 py-2.5 text-sm"
        />
        <button type="submit" className="btn-secondary shrink-0 px-4 py-2.5 text-sm">
          Use link
        </button>
      </form>

      {linkMsg === "youtube" && (
        <p className="mt-3 border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
          We can&apos;t pull videos straight from YouTube yet, because YouTube doesn&apos;t
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
        </p>
      )}
      {linkMsg === "invalid" && (
        <p className="mt-3 text-sm text-bad">
          That doesn&apos;t look like a YouTube link. Try a youtube.com or youtu.be URL.
        </p>
      )}

      <p className="mt-5 text-soft">
        No highlights yet?{" "}
        <Link href="/quiz" className="text-ink underline underline-offset-4 hover:text-cobalt">
          Take the 3-minute quiz
        </Link>
      </p>
    </div>
  );
}
