/**
 * Storage abstraction for highlight reels.
 *
 * - R2 mode (production, or whenever R2_* env vars are set): presigned
 *   direct-to-bucket uploads, worker downloads via presigned GET.
 * - Local mode (development fallback when R2 is not configured): videos are
 *   PUT to /api/local-upload and stored under .uploads/ in the project —
 *   zero external accounts. Refuses to run in production, where serverless
 *   filesystems don't persist.
 *
 * Adding the four R2_* values to the environment is the entire migration.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { presignVideoDownload, presignVideoUpload } from "./r2";

const LOCAL_DIR = path.join(process.cwd(), ".uploads");

export function storageMode(): "r2" | "local" {
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) return "r2";
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "R2 storage is not configured — set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET",
    );
  }
  return "local";
}

/** URL the browser should PUT the video to (either mode). */
export async function presignUpload(key: string, contentType: string): Promise<string> {
  if (storageMode() === "r2") return presignVideoUpload(key, contentType);
  return `/api/local-upload?key=${encodeURIComponent(key)}`;
}

/** Read the raw video for analysis (either mode). */
export async function readVideo(key: string): Promise<Buffer> {
  if (storageMode() === "r2") {
    const url = await presignVideoDownload(key);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`video download failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(safeLocalPath(key));
}

/** Local mode: persist an uploaded video under .uploads/, path-traversal safe. */
export async function writeLocalVideo(key: string, data: Buffer): Promise<void> {
  const p = safeLocalPath(key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
}

function safeLocalPath(key: string): string {
  const p = path.normalize(path.join(LOCAL_DIR, key));
  if (!p.startsWith(LOCAL_DIR + path.sep)) throw new Error("invalid storage key");
  return p;
}
