import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/**
 * Upsert the app's User row from the Clerk session. Every entry point (quiz
 * or film) can be a user's first action, so none may assume the row exists
 * or wait on webhook delivery. Returns null when signed out or emailless.
 */
export async function ensureUser() {
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!clerkUser || !email) return null;

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: { clerkId: clerkUser.id, email },
    update: { email },
  });
  const displayName = clerkUser.firstName ?? clerkUser.username ?? email.split("@")[0];
  return { user, displayName };
}
