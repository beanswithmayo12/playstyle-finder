import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { METRIC_KEYS, type MetricKey, type MetricVector } from "@/lib/metrics";
import { METRIC_LABELS } from "@/components/metric-labels";
import { BuyButton } from "@/components/buy-button";
import { PROGRAMS } from "@/data/programs";

export const dynamic = "force-dynamic";

// The sales page (docs/05): personalized gap pitch for the athlete's matched
// pro, Week 1 fully visible as proof-of-quality, weeks 2–8 teased.
export default async function PlansPage() {
  const { userId: clerkId } = await auth();

  const plans = await prisma.trainingPlan.findMany({
    where: { published: true },
    include: {
      proPlayer: true,
      sessions: { where: { week: 1 }, orderBy: { day: "asc" } },
    },
  });

  // Personalization: the signed-in athlete's latest match + gaps + ownership.
  let matchedProId: string | null = null;
  let deltas: MetricVector | null = null;
  const owned = new Set<string>();
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        planAccess: { select: { planId: true } },
        assessments: {
          where: { status: "COMPLETE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { match: true },
        },
      },
    });
    user?.planAccess.forEach((a) => owned.add(a.planId));
    const match = user?.assessments[0]?.match;
    if (match) {
      matchedProId = match.proPlayerId;
      deltas = match.metricDeltas as MetricVector;
    }
  }

  const featured = plans.find((p) => p.proPlayerId === matchedProId);
  const rest = plans.filter((p) => p !== featured);

  function gapBullets(targets: string[]): string[] {
    if (!deltas) return targets.map((t) => METRIC_LABELS[t as MetricKey] ?? t);
    return METRIC_KEYS.filter((k) => targets.includes(k) && (deltas![k] ?? 0) > 0)
      .sort((a, b) => deltas![b] - deltas![a])
      .map((k) => `${METRIC_LABELS[k]} (you're ${Math.round(deltas![k])} points behind)`);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-300">
          ← Back to your match
        </Link>
        <span className="text-sm text-zinc-500">⚽ Playstyle Finder</span>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-24">
        {featured ? (
          <section className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Built for your match
            </p>
            <h1 className="mt-2 text-3xl font-black">{featured.title}</h1>
            <p className="mt-3 text-zinc-300">{featured.description}</p>

            {(() => {
              const targets = PROGRAMS.find((p) => p.slug === featured.slug)?.targets ?? [];
              const bullets = gapBullets(targets);
              return bullets.length > 0 ? (
                <div className="mt-5">
                  <p className="font-semibold text-zinc-100">
                    This program closes YOUR gaps vs. {featured.proPlayer.knownAs}:
                  </p>
                  <ul className="mt-2 space-y-1 text-zinc-300">
                    {bullets.map((b) => (
                      <li key={b}>✓ {b}</li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })()}

            {/* Week 1 preview — real content, unlocked */}
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="mb-3 font-semibold">
                Week 1, fully open — see exactly what you&apos;re buying:
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                {featured.sessions.map((s) => (
                  <li key={s.id} className="flex justify-between gap-4">
                    <span>Day {s.day}: {s.title}</span>
                    <span className="shrink-0 text-zinc-500">{s.focus}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-zinc-500">
                Weeks 2–8: Build → Peak → Integration phases. 32 sessions total,
                every drill with sets, reps, coaching cues, and video reference.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {owned.has(featured.id) ? (
                <Link
                  href={`/program/${featured.id}`}
                  className="rounded-lg bg-emerald-500 px-8 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Open your program →
                </Link>
              ) : (
                <BuyButton planId={featured.id} priceCents={featured.priceCents} />
              )}
              <span className="text-sm text-zinc-500">
                14-day money-back guarantee · Lifetime access
              </span>
            </div>
          </section>
        ) : (
          <section className="mt-6 text-center">
            <h1 className="text-3xl font-black">8-Week Pro Programs</h1>
            <p className="mt-3 text-zinc-400">
              <Link href="/quiz" className="text-emerald-400 underline">
                Take the free analysis
              </Link>{" "}
              to get the program matched to your playstyle.
            </p>
          </section>
        )}

        {rest.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold text-zinc-300">
              {featured ? "Other programs" : "All programs"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((plan) => (
                <div key={plan.id} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <p className="text-sm text-zinc-500">{plan.proPlayer.knownAs}</p>
                  <h3 className="mt-1 font-bold">{plan.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-zinc-400">{plan.description}</p>
                  <div className="mt-4">
                    {owned.has(plan.id) ? (
                      <Link href={`/program/${plan.id}`} className="text-sm font-semibold text-emerald-400">
                        Open program →
                      </Link>
                    ) : (
                      <BuyButton planId={plan.id} priceCents={plan.priceCents} compact />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
