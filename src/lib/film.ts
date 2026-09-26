import { prisma } from "@/lib/db";
import type { VideoEvent } from "@/lib/ai/video";
import { computeFilmStats, filmMoments, type FilmMoment, type FilmStat } from "@/lib/film-stats";
import { playbackUrl } from "@/lib/storage";

export interface FilmBreakdownData {
  assessmentId: string;
  analyzedAt: string;
  stats: FilmStat[];
  moments: FilmMoment[];
  videoUrl: string | null; // null when the reel is gone (storage cleanup)
}

/**
 * The athlete's film breakdown — a specific assessment when given, otherwise
 * their latest completed film analysis. Ownership is enforced by userId.
 */
export async function loadFilmBreakdown(
  userId: string,
  assessmentId?: string | null,
): Promise<FilmBreakdownData | null> {
  const assessment = await prisma.assessment.findFirst({
    where: {
      userId,
      status: "COMPLETE",
      inputType: { in: ["VIDEO", "HYBRID"] },
      ...(assessmentId ? { id: assessmentId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, eventLog: true, videoKey: true, completedAt: true, createdAt: true },
  });
  if (!assessment) return null;

  const events = (assessment.eventLog as VideoEvent[] | null) ?? [];
  let videoUrl: string | null = null;
  if (assessment.videoKey) {
    try {
      videoUrl = await playbackUrl(assessment.videoKey);
    } catch {
      videoUrl = null;
    }
  }

  return {
    assessmentId: assessment.id,
    analyzedAt: (assessment.completedAt ?? assessment.createdAt).toISOString(),
    stats: computeFilmStats(events),
    moments: filmMoments(events),
    videoUrl,
  };
}
