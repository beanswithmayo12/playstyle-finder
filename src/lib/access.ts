import { prisma } from "@/lib/db";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"]; // past_due keeps access during dunning

/** A plan is unlocked by a direct grant (purchase/comp) OR an active membership. */
export async function userHasPlanAccess(userId: string, planId: string): Promise<boolean> {
  const [grant, sub] = await Promise.all([
    prisma.planAccess.findUnique({ where: { userId_planId: { userId, planId } } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  if (grant && (!grant.expiresAt || grant.expiresAt > new Date())) return true;
  return !!sub && ACTIVE_STATUSES.includes(sub.status);
}
