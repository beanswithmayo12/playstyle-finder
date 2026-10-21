import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { type MetricVector, type PositionGroup } from "@/lib/metrics";
import { SiteHeader } from "@/components/site-header";
import { BuildEditor } from "@/components/build-editor";

export const dynamic = "force-dynamic";

export default async function BuildPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      profile: true,
      build: true,
      assessments: {
        where: { status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  // The builder needs a position and a "you today" baseline → quiz first.
  if (!user?.profile || !user.assessments[0]?.metrics) redirect("/");

  return (
    <main className="min-h-screen text-ink">
      <SiteHeader back={{ href: "/dashboard", label: "Your match" }} width="max-w-3xl" />
      <div className="mx-auto max-w-3xl px-6 pb-24">
        <BuildEditor
          position={user.profile.positionGroup as PositionGroup}
          quizMetrics={user.assessments[0].metrics as MetricVector}
          savedBuild={(user.build?.metrics as MetricVector | undefined) ?? null}
        />
      </div>
    </main>
  );
}
