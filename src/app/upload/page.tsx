import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { UploadFlow } from "@/components/upload-flow";

export const dynamic = "force-dynamic";

// Public route: signed-out visitors get an inline sign-up gate (so a reel
// dropped on the landing page survives the round trip in IndexedDB).
export default async function UploadPage() {
  const { userId } = await auth();
  let initialPosition: string | null = null;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { profile: true },
    });
    initialPosition = user?.profile?.positionGroup ?? null;
  }
  return <UploadFlow signedIn={!!userId} initialPosition={initialPosition} />;
}
