"use client";

import { useRef, useState } from "react";

export const MAX_REEL_BYTES = 250 * 1024 * 1024;

const TYPES_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/**
 * Browsers sometimes report an empty MIME type (notably for .mov), which the
 * upload API would reject — fall back to the extension.
 */
export function reelContentType(file: File): string | null {
  if (Object.values(TYPES_BY_EXT).includes(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPES_BY_EXT[ext] ?? null;
}

export function VideoDropzone({
  onFile,
  compact = false,
}: {
  onFile: (file: File) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function accept(file: File | undefined) {
    if (!file) return;
    if (!reelContentType(file)) {
      setError("That file isn't a video we can read — use an mp4, mov, or webm.");
      return;
    }
    if (file.size > MAX_REEL_BYTES) {
      setError("That video is over 250 MB — trim it to your best ~3 minutes.");
      return;
    }
    setError("");
    onFile(file);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition ${
          compact ? "px-6 py-8" : "px-6 py-12 sm:py-14"
        } ${
          dragging
            ? "border-emerald-400 bg-emerald-500/10"
            : "border-zinc-700 bg-zinc-900/60 hover:border-emerald-500/60 hover:bg-zinc-900"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-2xl">
          🎬
        </div>
        <p className="mt-4 text-lg font-semibold text-zinc-100">
          {dragging ? "Drop it here" : "Drag & drop your highlight reel"}
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          or <span className="font-semibold text-emerald-400 underline">browse your files</span>
        </p>
        <p className="mt-3 text-xs text-zinc-600">MP4, MOV or WebM · up to 250 MB (~3 min)</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          className="hidden"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
