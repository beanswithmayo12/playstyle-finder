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

export function VideoDropzone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function accept(file: File | undefined) {
    if (!file) return;
    if (!reelContentType(file)) {
      setError("That file isn't a video we can read. Use an MP4, MOV or WebM.");
      return;
    }
    if (file.size > MAX_REEL_BYTES) {
      setError("That video is over 250 MB. Trim it to your best 3 minutes or so.");
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
        aria-label="Upload a highlight reel"
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
        className={`pop offset-shadow flex cursor-pointer flex-wrap items-center justify-between gap-4 border-[1.5px] px-5 py-5 transition [--pop-scale:1.015] ${
          dragging ? "border-cobalt bg-cobalt/5" : "border-rule-strong bg-surface hover:bg-cobalt/5"
        }`}
      >
        <div>
          <p className="text-lg font-bold">{dragging ? "Drop it here" : "Drop your highlight reel"}</p>
          <p className="font-mono text-sm text-soft">MP4 · MOV · WebM · up to 3 min</p>
        </div>
        <span className="btn-primary pointer-events-none">Browse files</span>
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
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
    </div>
  );
}
