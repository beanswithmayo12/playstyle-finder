import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { loadFilmBreakdown } from "@/lib/film";
import { SiteHeader } from "@/components/site-header";
import { FilmBreakdown } from "@/components/film-breakdown";

export const dynamic = "force-dynamic";

export default async function FilmPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/");

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) redirect("/");

  const { id } = await searchParams;
  const film = await loadFilmBreakdown(user.id, id);

  return (
    <main className="min-h-screen text-ink">
      <SiteHeader back={{ href: "/dashboard", label: "Your match" }} width="max-w-3xl" />
      <div className="mx-auto max-w-3xl px-6 pb-24">
        <h1 className="mt-6 text-3xl display">Your film breakdown</h1>
        {film ? (
          <>
            <p className="mt-2 mb-8 text-soft">
              Every action our AI tagged in your reel. Tap a moment to jump straight to it.
            </p>
            <FilmBreakdown stats={film.stats} moments={film.moments} videoUrl={film.videoUrl} />
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-rule bg-surface p-8 text-center">
            <p className="text-ink-2">You haven&apos;t had any film analyzed yet.</p>
            <Link
              href="/upload"
              className="mt-5 inline-block rounded-lg bg-cobalt px-6 py-3 font-semibold text-on-cobalt transition hover:bg-cobalt-hover"
            >
              Upload a highlight reel
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
