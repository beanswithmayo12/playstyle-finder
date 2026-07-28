import Stripe from "stripe";
import { prisma } from "@/lib/db";

// Pin the API version so Stripe dashboard upgrades never change payload
// shapes under us; bump deliberately alongside SDK upgrades.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

/**
 * Get or lazily create the Stripe customer for a user, storing the id so
 * every purchase and the membership subscription share one customer record
 * (required for the Customer Portal and clean revenue reporting).
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create(
    { email: user.email, metadata: { userId } },
    // Idempotent per user: a double-click can't create two customers.
    { idempotencyKey: `customer-create-${userId}` },
  );

  // Guard against a concurrent request having won the race.
  const { count } = await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });

  if (count === 0) {
    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return fresh.stripeCustomerId!;
  }
  return customer.id;
}
