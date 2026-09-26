import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { VideoEvent } from "@/lib/ai/video";
import { computeFilmStats, statLine } from "@/lib/film-stats";
import { ProfileEditor } from "@/components/profile-editor";

export const dynamic = "force-dynamic";

export default async function ProfileEditorPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      recruiting: true,
      profile: true,
      assessments: {
        where: { status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        select: { id: true, inputType: true, createdAt: true, eventLog: true },
      },
    },
  });
  if (!user) redirect("/");

  const reels = user.assessments
    .filter((a) => a.inputType !== "QUESTIONNAIRE")
    .map((a) => ({
      id: a.id,
      label: `${a.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${
        statLine(computeFilmStats((a.eventLog as VideoEvent[] | null) ?? []), 2) || "reel"
      }`,
    }));

  const r = user.recruiting;
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-300">
          ← Your match
        </Link>
        <span className="text-sm text-zinc-500">⚽ Playstyle Finder</span>
      </header>
      <div className="mx-auto max-w-2xl px-6 pb-24">
        <h1 className="mt-6 text-3xl font-black">Your recruiting profile</h1>
        <p className="mt-2 text-zinc-400">
          A page you can send to college and club coaches: your ratings, pro match,
          best-fit positions and highlight film. It stays private until you publish it.
        </p>
        <ProfileEditor
          hasAnalysis={user.assessments.length > 0}
          displayName={user.profile?.displayName ?? "Player"}
          reels={reels}
          initial={{
            slug: r?.slug ?? null,
            published: r?.published ?? false,
            gradYear: r?.gradYear ?? null,
            team: r?.team ?? "",
            location: r?.location ?? "",
            heightCm: r?.heightCm ?? null,
            bio: r?.bio ?? "",
            contactEmail: r?.contactEmail ?? "",
            featuredAssessmentId: r?.featuredAssessmentId ?? reels[0]?.id ?? null,
          }}
        />
      </div>
    </main>
  );
}
