/**
 * Shared final stage for every analysis path (questionnaire, video, hybrid):
 * rank against the roster → generate the explanation → persist the match.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { METRIC_KEYS, type MetricConfidence, type MetricVector, type PositionGroup } from "@/lib/metrics";
import { displayMatchPercent, rankMatches, type ProCandidate } from "@/lib/matching";
import { MATCH_EXPLAINER_SYSTEM } from "@/lib/prompts";
import { isMockAI, mockExplanation } from "@/lib/ai/mock";
import { METRIC_LABELS } from "@/components/metric-labels";

// Lazy so mock mode never needs an API key in the environment.
let _anthropic: Anthropic | null = null;
function anthropicClient(): Anthropic {
  return (_anthropic ??= new Anthropic());
}

export interface MatchOutcome {
  assessmentId: string;
  proSlug: string;
  proKnownAs: string;
  archetype: string;
  matchPercent: number;
  explanation: string;
}

/**
 * Completes an existing assessment row with metrics + match. The assessment
 * must already exist (PENDING/PROCESSING for video; created inline for text).
 */
export async function completeAssessment(args: {
  assessmentId: string;
  position: PositionGroup;
  metrics: MetricVector;
  confidence: MetricConfidence;
  scoutNotes: string;
  eventLog?: unknown;
}): Promise<MatchOutcome> {
  const pros = await prisma.proPlayer.findMany({ where: { active: true } });
  const candidates: ProCandidate[] = pros.map((p) => ({
    id: p.id,
    slug: p.slug,
    knownAs: p.knownAs,
    positionGroup: p.positionGroup as PositionGroup,
    metrics: p.metrics as ProCandidate["metrics"],
  }));

  const ranked = rankMatches(args.metrics, args.position, candidates);
  if (ranked.length === 0) throw new Error("no candidates — is the roster seeded?");
  const best = ranked[0];
  const bestPro = pros.find((p) => p.id === best.pro.id)!;

  let explanationText: string;
  if (isMockAI()) {
    const topGaps = METRIC_KEYS.map((k) => ({ k, d: best.deltas[k] }))
      .filter((g) => g.d > 0)
      .sort((a, b) => b.d - a.d)
      .slice(0, 3)
      .map((g) => `${METRIC_LABELS[g.k]} (−${Math.round(g.d)})`);
    explanationText = mockExplanation({
      proKnownAs: bestPro.knownAs,
      archetype: bestPro.archetype,
      styleSummary: bestPro.styleSummary,
      topGaps,
    });
  } else {
    const explanation = await anthropicClient().messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1200,
      system: MATCH_EXPLAINER_SYSTEM,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            athlete: { metrics: args.metrics, scoutNotes: args.scoutNotes },
            pro: {
              knownAs: bestPro.knownAs,
              archetype: bestPro.archetype,
              styleSummary: bestPro.styleSummary,
              metrics: bestPro.metrics,
            },
            deltas: best.deltas,
            runnersUp: ranked.slice(1).map((r) => r.pro.knownAs),
          }),
        },
      ],
    });
    explanationText = explanation.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchResult.deleteMany({ where: { assessmentId: args.assessmentId } });
    await tx.assessment.update({
      where: { id: args.assessmentId },
      data: {
        status: "COMPLETE",
        metrics: args.metrics,
        confidence: args.confidence,
        eventLog: args.eventLog as never,
        completedAt: new Date(),
        match: {
          create: {
            proPlayerId: best.pro.id,
            similarity: best.similarity,
            explanation: explanationText,
            runnersUp: ranked.slice(1).map((r) => ({
              proPlayerId: r.pro.id,
              similarity: r.similarity,
            })),
            metricDeltas: best.deltas,
          },
        },
      },
    });
  });

  return {
    assessmentId: args.assessmentId,
    proSlug: bestPro.slug,
    proKnownAs: bestPro.knownAs,
    archetype: bestPro.archetype,
    matchPercent: displayMatchPercent(best.similarity),
    explanation: explanationText,
  };
}
