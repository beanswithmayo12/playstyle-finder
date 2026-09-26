import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { loadFilmBreakdown } from "@/lib/film";
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
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-300">
          ← Your match
        </Link>
        <span className="text-sm text-zinc-500">⚽ Playstyle Finder</span>
      </header>
      <div className="mx-auto max-w-3xl px-6 pb-24">
        <h1 className="mt-6 text-3xl font-black">Your film breakdown</h1>
        {film ? (
          <>
            <p className="mt-2 mb-8 text-zinc-400">
              Every action our AI tagged in your reel. Tap a moment to jump straight to it.
            </p>
            <FilmBreakdown stats={film.stats} moments={film.moments} videoUrl={film.videoUrl} />
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-300">You haven&apos;t had any film analyzed yet.</p>
            <Link
              href="/upload"
              className="mt-5 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Upload a highlight reel
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
