# 07 — Stripe Integration Plan (Payments + Billing)

Tailored to this product: one-time training-plan purchases (**Payments**) and
a recurring membership tier (**Billing**), fulfilled by webhook.

## Product → Stripe Mapping

| Offer | Stripe object | Mode |
|---|---|---|
| 8-week pro program ($49 one-time) | Product + one-time Price per `TrainingPlan` (`stripePriceId`) | Checkout `mode: payment` |
| Order bump (+$19) | Optional line item / Checkout dashboard config | added to same session |
| Membership ($12/mo) | Single recurring Price (`STRIPE_MEMBERSHIP_PRICE_ID`) | Checkout `mode: subscription` |
| Self-serve billing management | Customer Portal | `/api/billing/portal` |

## Architecture (all server-side, hosted Checkout)

```
Sales page ──POST /api/checkout──► Checkout Session ──redirect──► Stripe-hosted page
                                                                        │ pays
   DB (Purchase/PlanAccess/Subscription) ◄── /api/stripe/webhook ◄── events
   Dashboard "Manage billing" ──POST /api/billing/portal──► Customer Portal
```

Hosted Checkout means no PCI burden, Apple Pay/Google Pay for free, and
promotion codes enabled with one flag.

## Files

| File | Role |
|---|---|
| `src/lib/stripe.ts` | Pinned-API-version client + `getOrCreateStripeCustomer` (one customer per user, race-safe, idempotency key) |
| `src/app/api/checkout/route.ts` | Creates sessions for plan purchases and membership; blocks double-purchase/double-subscribe |
| `src/app/api/stripe/webhook/route.ts` | Sole fulfillment path: signature check → idempotency ledger → grant/revoke |
| `src/app/api/billing/portal/route.ts` | Customer Portal redirect |
| `src/lib/access.ts` | `userHasPlanAccess` = direct grant OR active membership |
| `prisma/schema.prisma` | `Purchase`, `PlanAccess`, `Subscription`, `StripeEvent`, `User.stripeCustomerId` |

## Best Practices Applied (review checklist)

- ✅ **Signature verification** before parsing any webhook body
- ✅ **Idempotent webhook processing** — `StripeEvent` ledger claims each event id exactly once (Stripe retries deliveries)
- ✅ **Fulfillment only via webhook** — success redirects are cosmetic
- ✅ **`payment_status === "paid"` check** + `async_payment_succeeded/failed` handled (delayed payment methods don't complete synchronously)
- ✅ **One Stripe customer per user** — created lazily with an idempotency key, race-guarded in the DB; required for the Portal and clean reporting
- ✅ **Subscription state mirrored from `customer.subscription.*` events only** — covers renewals, dunning (`past_due`), portal cancellations
- ✅ **Pinned `apiVersion`** matching the SDK, upgraded deliberately
- ✅ **Metadata contracts** (`userId`, `planId`, `kind`) set on both session and subscription so webhooks never guess
- ✅ **Secret key never leaves the server**; only session URLs are returned to the client
- ✅ **`allow_promotion_codes`** for launch discounts without code changes

## Dashboard Setup (test mode, ~10 min)

1. Create Products/Prices: one one-time Price per training plan (write ids
   into `TrainingPlan.stripePriceId`), one recurring $12/mo Price →
   `STRIPE_MEMBERSHIP_PRICE_ID`.
2. Enable Apple Pay / Google Pay (Settings → Payment methods).
3. Configure the Customer Portal (Settings → Billing → Portal): allow
   cancellation + payment-method updates.
4. Webhook endpoint → `https://<domain>/api/stripe/webhook` with events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `charge.refunded`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy the signing secret →
   `STRIPE_WEBHOOK_SECRET`.
5. Fill `.env`: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `STRIPE_MEMBERSHIP_PRICE_ID`,
   `NEXT_PUBLIC_APP_URL`.

## Local Testing

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook  # secret → .env
stripe trigger checkout.session.completed
# Card 4242 4242 4242 4242 (any future date / any CVC) for real checkout runs
```

Test the full loop: buy a plan → `PlanAccess` row appears → success page
unlocks; subscribe → `Subscription.status = "active"`; cancel in Portal →
webhook flips `cancelAtPeriodEnd`; refund in dashboard → `Purchase.REFUNDED`.

## Go-Live Checklist

- [ ] Swap test keys for live keys in Vercel env
- [ ] Recreate Products/Prices + webhook endpoint in live mode (test-mode objects don't carry over)
- [ ] Turn on Stripe Tax if selling into taxed jurisdictions
- [ ] Set statement descriptor + support email (Settings → Public details)
- [ ] Enable Stripe Radar default rules (fraud)
- [ ] Decide the refund→revoke policy in `charge.refunded` (currently: access retained)
