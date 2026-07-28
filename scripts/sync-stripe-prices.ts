/**
 * Create Stripe Products/Prices for training plans still carrying placeholder
 * price ids, and write the real price ids back to the database.
 *
 * Run after seeding, with a real STRIPE_SECRET_KEY in .env:
 *   npx tsx scripts/sync-stripe-prices.ts
 *
 * Idempotent: plans whose stripePriceId doesn't start with "placeholder_"
 * are skipped. Re-run any time you add a program.
 */

import "dotenv/config";
import Stripe from "stripe";
import { prisma } from "../src/lib/db";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("placeholder")) {
    throw new Error("Set a real STRIPE_SECRET_KEY in .env first.");
  }
  const stripe = new Stripe(key);

  const plans = await prisma.trainingPlan.findMany({
    where: { stripePriceId: { startsWith: "placeholder_" } },
    include: { proPlayer: { select: { knownAs: true } } },
  });
  if (plans.length === 0) {
    console.log("All plans already have real Stripe prices. Nothing to do.");
    return;
  }

  for (const plan of plans) {
    const product = await stripe.products.create(
      {
        name: plan.title,
        description: `8-week training program modeled on ${plan.proPlayer.knownAs}.`,
        metadata: { planSlug: plan.slug },
      },
      { idempotencyKey: `product-${plan.slug}` },
    );
    const price = await stripe.prices.create(
      {
        product: product.id,
        unit_amount: plan.priceCents,
        currency: "usd",
        metadata: { planSlug: plan.slug },
      },
      { idempotencyKey: `price-${plan.slug}-${plan.priceCents}` },
    );
    await prisma.trainingPlan.update({
      where: { id: plan.id },
      data: { stripePriceId: price.id },
    });
    console.log(`${plan.slug}: ${price.id}`);
  }
  console.log(`Synced ${plans.length} plan(s) to Stripe.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
