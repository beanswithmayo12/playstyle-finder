/**
 * Seed the pro player roster. Run with: npx prisma db seed
 * Idempotent — upserts by slug, so re-running after editing
 * src/data/pros.ts updates profiles in place.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { PROS } from "../src/data/pros";
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
