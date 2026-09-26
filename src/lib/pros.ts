import { prisma } from "@/lib/db";
import type { PositionGroup } from "@/lib/metrics";
import type { ProCandidate } from "@/lib/matching";

/** The active roster in the shape the matching engine consumes. */
export async function loadProCandidates(): Promise<ProCandidate[]> {
  const pros = await prisma.proPlayer.findMany({ where: { active: true } });
  return pros.map((p) => ({
    id: p.id,
    slug: p.slug,
    knownAs: p.knownAs,
    positionGroup: p.positionGroup as PositionGroup,
    metrics: p.metrics as ProCandidate["metrics"],
  }));
}
