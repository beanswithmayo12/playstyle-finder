/**
 * The video analysis pipeline (docs/01-architecture.md):
 *   download from R2 → ffmpeg frame sampling → static-frame prefilter →
 *   Claude frame-batch analysis → event aggregation → hybrid merge with the
 *   latest questionnaire → match → persist.
 *
 * Frames never cross step boundaries (they'd blow Inngest's step-output
 * limits) — the heavy work happens inside one step; only small JSON leaves it.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { inngest, type VideoAnalysisRequested } from "@/lib/inngest";
import { prisma } from "@/lib/db";
import { presignVideoDownload } from "@/lib/r2";
import { isCompleteVector, type MetricConfidence, type MetricVector, type PositionGroup } from "@/lib/metrics";
import { analyzeFrameBatch, aggregateEvents, mergeByConfidence, type Frame, type VideoEvent } from "@/lib/ai/video";
import { completeAssessment } from "@/lib/analysis";

const exec = promisify(execFile);

const MAX_DURATION_SEC = 200; // ~3 min cap (cost guardrail)
const FRAME_INTERVAL_SEC = 2;
const BATCH_SIZE = 24;

export const analyzeVideo = inngest.createFunction(
  {
    id: "analyze-video",
    retries: 2,
    concurrency: { limit: 3 },
    triggers: { event: "video/analysis.requested" },
    // All retries exhausted → surface FAILED so the UI stops polling.
    onFailure: async ({ event }) => {
      const original = event.data.event as { data?: { assessmentId?: string } };
      const assessmentId = original?.data?.assessmentId;
      if (assessmentId) {
        await prisma.assessment.update({
          where: { id: assessmentId },
          data: { status: "FAILED" },
        });
      }
    },
  },
  async ({ event, step }) => {
    const { assessmentId, userId, videoKey, positionGroup, jerseyColor, jerseyNumber } =
      event.data as VideoAnalysisRequested;

    await step.run("mark-processing", () =>
      prisma.assessment.update({ where: { id: assessmentId }, data: { status: "PROCESSING" } }),
    );

    // Heavy stage: everything frame-related stays inside this one step.
    const analyzed = await step.run("extract-and-analyze", async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "reel-"));
      try {
        const url = await presignVideoDownload(videoKey);
        const videoFile = path.join(dir, "input.mp4");
        const res = await fetch(url);
        if (!res.ok) throw new Error(`video download failed: ${res.status}`);
        await writeFile(videoFile, Buffer.from(await res.arrayBuffer()));

        // Sample 1 frame / 2s at 768px, hard-capped at MAX_DURATION_SEC.
        await exec(ffmpegPath as unknown as string, [
          "-i", videoFile,
          "-t", String(MAX_DURATION_SEC),
          "-vf", `fps=1/${FRAME_INTERVAL_SEC},scale=768:-1`,
          "-q:v", "4",
          path.join(dir, "f_%04d.jpg"),
        ]);

        const files = (await readdir(dir)).filter((f) => f.endsWith(".jpg")).sort();
        if (files.length < 5) throw new Error("too few frames — is the video valid?");

        // Static-frame prefilter: drop frames nearly identical in size to the
        // previous one (paused footage, replay wipes, scoreboards).
        const frames: Frame[] = [];
        let prevSize = -1;
        for (let i = 0; i < files.length; i++) {
          const buf = await readFile(path.join(dir, files[i]));
          if (prevSize > 0 && Math.abs(buf.length - prevSize) / prevSize < 0.02) continue;
          prevSize = buf.length;
          frames.push({ timestampSec: i * FRAME_INTERVAL_SEC, base64: buf.toString("base64") });
        }

        // Batch through Claude in parallel.
        const batches: Frame[][] = [];
        for (let i = 0; i < frames.length; i += BATCH_SIZE) {
          batches.push(frames.slice(i, i + BATCH_SIZE));
        }
        const results = await Promise.all(
          batches.map((b) => analyzeFrameBatch(b, { jerseyColor, jerseyNumber })),
        );
        const events: VideoEvent[] = results
          .flatMap((r) => r.events)
          .sort((a, b) => a.tStart - b.tStart);
        const contexts = results.map((r) => r.context);
        const reelDurationSec = files.length * FRAME_INTERVAL_SEC;

        const scored = await aggregateEvents(events, contexts, positionGroup, reelDurationSec);
        if (!isCompleteVector(scored.metrics)) throw new Error("aggregation produced invalid metrics");

        return {
          metrics: scored.metrics,
          confidence: scored.confidence,
          scoutNotes: scored.scoutNotes,
          events,
          frameCount: frames.length,
        };
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });

    // Hybrid merge: fold in the latest questionnaire, if one exists.
    const merged = await step.run("hybrid-merge", async () => {
      const quiz = await prisma.assessment.findFirst({
        where: { userId, inputType: "QUESTIONNAIRE", status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
      });
      if (!quiz?.metrics) {
        return { metrics: analyzed.metrics, confidence: analyzed.confidence, hybrid: false };
      }
      const m = mergeByConfidence(
        { metrics: analyzed.metrics as MetricVector, confidence: analyzed.confidence as MetricConfidence },
        { metrics: quiz.metrics as MetricVector, confidence: (quiz.confidence ?? {}) as MetricConfidence },
      );
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: { inputType: "HYBRID" },
      });
      return { ...m, hybrid: true };
    });

    const outcome = await step.run("match-and-persist", () =>
      completeAssessment({
        assessmentId,
        position: positionGroup as PositionGroup,
        metrics: merged.metrics as MetricVector,
        confidence: merged.confidence as MetricConfidence,
        scoutNotes: analyzed.scoutNotes,
        eventLog: analyzed.events,
      }),
    );

    return { ...outcome, hybrid: merged.hybrid, framesAnalyzed: analyzed.frameCount };
  },
);

