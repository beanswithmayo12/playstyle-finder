/**
 * POST /api/stripe/webhook — the ONLY place purchases are fulfilled.
 *
 * Integrity rules (see docs/02-database-schema.md):
 *  - Verify the Stripe signature before touching the body.
 *  - Idempotency via the StripeEvent ledger (Stripe retries deliveries).
 *  - Never trust the success-page redirect for fulfillment.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
    case "checkout.session.completed": {
      const session = event.data.object;
      const { userId, planId } = session.metadata ?? {};
      if (!userId || !planId) break; // not a plan purchase we created

      await prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.upsert({
          where: { stripeCheckoutSessionId: session.id },
          create: {
            userId,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string | null,
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
  }

  return NextResponse.json({ received: true });
}
