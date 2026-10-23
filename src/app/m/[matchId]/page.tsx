import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { displayMatchPercent } from "@/lib/matching";
import { SiteHeader } from "@/components/site-header";

// Public share page — the viral loop's landing pad (docs/05). Shows the
// match (never the athlete's identity or metrics) and funnels to the quiz.

async function getMatch(matchId: string) {
  return prisma.matchResult.findUnique({
    where: { id: matchId },
    include: { proPlayer: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matchId: string }>;
}): Promise<Metadata> {
  const { matchId } = await params;
  const match = await getMatch(matchId);
  if (!match) return {};
  const pct = displayMatchPercent(match.similarity);
  const title = `A ${pct}% playstyle match with ${match.proPlayer.knownAs}`;
  return {
    title,
    description: `${match.proPlayer.archetype}. Find out which pro YOUR game matches — free 3-minute analysis.`,
    openGraph: { title, images: [`/api/og/${matchId}`] },
    twitter: { card: "summary_large_image", title, images: [`/api/og/${matchId}`] },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await getMatch(matchId);
  if (!match) notFound();

  const pct = displayMatchPercent(match.similarity);

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 text-center text-ink">
        <p className="mb-4 rounded-full border border-rule px-4 py-1 text-sm text-soft">
          Playstyle Finder
        </p>
        <p className="text-sm uppercase tracking-widest text-soft">
          This player&apos;s style is a {pct}% match with
        </p>
        <h1 className="mt-3 text-5xl display tracking-tight text-cobalt sm:text-6xl">
          {match.proPlayer.knownAs}
        </h1>
        <p className="mt-3 text-lg text-ink-2">{match.proPlayer.archetype}</p>
        <p className="mt-1 text-sm italic text-soft">
          &ldquo;{match.proPlayer.tagline}&rdquo;
        </p>
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-soft">Which pro does YOUR game match?</p>
          <Link
            href="/quiz"
            className="pop rounded-lg bg-cobalt px-8 py-3 font-semibold text-on-cobalt transition hover:bg-cobalt-hover"
          >
            Find my match — free
          </Link>
          <p className="text-xs text-faint">3-minute analysis · No card required</p>
        </div>
      </main>
    </>
  );
}
