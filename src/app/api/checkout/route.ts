/**
 * POST /api/checkout — create a Stripe Checkout Session.
 *
 * Body: { planId: string }            → one-time purchase of a training plan
 *       { membership: true }          → recurring membership subscription
 *
 * Fulfillment NEVER happens here or on the success redirect — only in
 * /api/stripe/webhook. This route only prices and redirects.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "user not synced" }, { status: 400 });

  const body = (await req.json()) as { planId?: string; membership?: boolean };
  const customerId = await getOrCreateStripeCustomer(user.id);

  // ── Membership (Stripe Billing, mode: subscription) ──
  if (body.membership) {
    const priceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID;
    if (!priceId) return NextResponse.json({ error: "membership not configured" }, { status: 500 });

    const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (existing && ["active", "trialing", "past_due"].includes(existing.status)) {
      return NextResponse.json({ error: "already subscribed" }, { status: 409 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: user.id, kind: "membership" },
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${APP_URL}/dashboard?membership=success`,
      cancel_url: `${APP_URL}/dashboard?membership=cancelled`,
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  }

  // ── One-time training plan purchase (mode: payment) ──
  if (!body.planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

  const plan = await prisma.trainingPlan.findUnique({ where: { id: body.planId } });
  if (!plan?.published) return NextResponse.json({ error: "plan not found" }, { status: 404 });
  if (plan.stripePriceId.startsWith("placeholder_")) {
    return NextResponse.json(
      { error: "plan not synced to Stripe — run scripts/sync-stripe-prices.ts" },
      { status: 500 },
    );
  }

  const alreadyOwned = await prisma.planAccess.findUnique({
    where: { userId_planId: { userId: user.id, planId: plan.id } },
  });
  if (alreadyOwned) return NextResponse.json({ error: "already purchased" }, { status: 409 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    metadata: { userId: user.id, planId: plan.id, kind: "plan" },
    success_url: `${APP_URL}/program/${plan.id}?purchase=success`,
    cancel_url: `${APP_URL}/plans/${plan.id}?purchase=cancelled`,
    allow_promotion_codes: true,
    // Order bump / upsell experiments live in the Checkout dashboard config,
    // or add a second optional line_item here later.
  });

  return NextResponse.json({ url: session.url });
}
