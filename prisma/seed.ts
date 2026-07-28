/**
 * Seed the pro player roster. Run with: npx prisma db seed
 * Idempotent — upserts by slug, so re-running after editing
 * src/data/pros.ts updates profiles in place.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { PROS } from "../src/data/pros";
import { PROGRAMS, buildProgramSessions } from "../src/data/programs";
import { isCompleteVector } from "../src/lib/metrics";

async function main() {
  for (const pro of PROS) {
    if (!isCompleteVector(pro.metrics)) {
      throw new Error(`Invalid metric vector for ${pro.slug}`);
    }
    await prisma.proPlayer.upsert({
      where: { slug: pro.slug },
      create: {
        slug: pro.slug,
        fullName: pro.fullName,
        knownAs: pro.knownAs,
        nationality: pro.nationality,
        club: pro.club,
        positionGroup: pro.positionGroup,
        preferredFoot: pro.preferredFoot,
        archetype: pro.archetype,
        tagline: pro.tagline,
        metrics: pro.metrics,
        styleSummary: pro.styleSummary,
        studyClips: pro.studyClips,
      },
      update: {
        fullName: pro.fullName,
        knownAs: pro.knownAs,
        nationality: pro.nationality,
        club: pro.club,
        positionGroup: pro.positionGroup,
        preferredFoot: pro.preferredFoot,
        archetype: pro.archetype,
        tagline: pro.tagline,
        metrics: pro.metrics,
        styleSummary: pro.styleSummary,
        studyClips: pro.studyClips,
      },
    });
  }
  console.log(`Seeded ${PROS.length} pro players.`);

  // ── Training programs (published with placeholder price ids; run
  //    scripts/sync-stripe-prices.ts to create real Stripe prices) ──
  for (const def of PROGRAMS) {
    const pro = await prisma.proPlayer.findUniqueOrThrow({ where: { slug: def.proSlug } });
    const plan = await prisma.trainingPlan.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        proPlayerId: pro.id,
        title: def.title,
        description: def.description,
        priceCents: def.priceCents,
        stripePriceId: `placeholder_${def.slug}`,
        published: true,
      },
      update: {
        proPlayerId: pro.id,
        title: def.title,
        description: def.description,
        priceCents: def.priceCents,
        published: true,
      },
    });

    for (const s of buildProgramSessions(def)) {
      await prisma.planSession.upsert({
        where: { planId_week_day: { planId: plan.id, week: s.week, day: s.day } },
        create: {
          planId: plan.id,
          week: s.week,
          day: s.day,
          title: s.title,
          focus: s.focus,
          content: s.content,
        },
        update: { title: s.title, focus: s.focus, content: s.content },
      });
    }
  }
  console.log(`Seeded ${PROGRAMS.length} training programs (32 sessions each).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
