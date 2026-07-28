/**
 * POST /api/stripe/webhook — the ONLY place purchases and memberships are
 * fulfilled or revoked.
 *
 * Integrity rules (see docs/02-database-schema.md):
 *  - Verify the Stripe signature before touching the body.
 *  - Idempotency via the StripeEvent ledger (Stripe retries deliveries).
 *  - Never trust the success-page redirect for fulfillment.
 *
 * Events to enable on the endpoint (dashboard or `stripe listen`):
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, charge.refunded,
 *   customer.subscription.created, customer.subscription.updated,
 *   customer.subscription.deleted
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  // Idempotency: claim the event id; if it's already in the ledger, ack and exit.
  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    // Cards complete synchronously; bank debits etc. land as async_payment_*.
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.mode === "payment" && session.payment_status === "paid") {
        await fulfillPlanPurchase(session);
      }
      // mode === "subscription" is handled by customer.subscription.* events.
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      await prisma.purchase.updateMany({
        where: { stripeCheckoutSessionId: session.id },
        data: { status: "FAILED" },
      });
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      if (typeof charge.payment_intent === "string") {
        await prisma.purchase.updateMany({
          where: { stripePaymentIntentId: charge.payment_intent },
          data: { status: "REFUNDED" },
        });
        // Policy call: revoke PlanAccess on refund or let it lapse quietly.
      }
      break;
    }

    // Single source of truth for membership state — covers new subscriptions,
    // renewals, payment failures (past_due), cancellations, and portal changes.
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfillPlanPurchase(session: Stripe.Checkout.Session) {
  const { userId, planId } = session.metadata ?? {};
  if (!userId || !planId) return; // not a plan purchase we created

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.upsert({
      where: { stripeCheckoutSessionId: session.id },
      create: {
        userId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        stripeCustomerId: session.customer as string,
        amountCents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        status: "PAID",
      },
      update: { status: "PAID" },
    });

    await tx.planAccess.upsert({
      where: { userId_planId: { userId, planId } },
      create: { userId, planId, purchaseId: purchase.id },
      update: {}, // already has access — never double-grant
    });
  });
  // Post-purchase email (receipt + "start week 1") goes here via Resend.
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  const item = sub.items.data[0];
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      userId,
      stripeSubscriptionId: sub.id,
      stripePriceId: item?.price.id ?? "",
      status: sub.status,
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      stripePriceId: item?.price.id ?? "",
      status: sub.status,
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}
