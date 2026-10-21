import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { METRIC_KEYS, type MetricKey, type MetricVector } from "@/lib/metrics";
import { METRIC_LABELS } from "@/components/metric-labels";
import { BuyButton } from "@/components/buy-button";
import { SiteHeader } from "@/components/site-header";
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
      sessions: { where: { week: 1, track: "SOLO" }, orderBy: { day: "asc" } },
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
    <main className="min-h-screen text-ink">
      <SiteHeader back={{ href: "/dashboard", label: "Back to your match" }} width="max-w-3xl" />

      <div className="mx-auto max-w-3xl px-6 pb-24">
        {featured ? (
          <section className="mt-6 rounded-2xl border border-cobalt/40 bg-cobalt/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-cobalt">
              Built for your match
            </p>
            <h1 className="mt-2 text-3xl display">{featured.title}</h1>
            <p className="mt-3 text-ink-2">{featured.description}</p>

            {(() => {
              const targets = PROGRAMS.find((p) => p.slug === featured.slug)?.targets ?? [];
              const bullets = gapBullets(targets);
              return bullets.length > 0 ? (
                <div className="mt-5">
                  <p className="font-semibold text-ink">
                    This program closes YOUR gaps vs. {featured.proPlayer.knownAs}:
                  </p>
                  <ul className="mt-2 space-y-1 text-ink-2">
                    {bullets.map((b) => (
                      <li key={b}>✓ {b}</li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })()}

            {/* Week 1 preview — real content, unlocked */}
            <div className="mt-6 rounded-xl border border-rule bg-paper p-5">
              <p className="mb-3 font-semibold">
                Week 1, fully open — see exactly what you&apos;re buying:
              </p>
              <ul className="space-y-2 text-sm text-ink-2">
                {featured.sessions.map((s) => (
                  <li key={s.id} className="flex justify-between gap-4">
                    <span>Day {s.day}: {s.title}</span>
                    <span className="shrink-0 text-soft">{s.focus}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-soft">
                Weeks 2–8: Build → Peak → Integration phases. 32 solo sessions total,
                every drill with sets, reps, coaching cues, and video reference.
              </p>
              <p className="mt-2 text-sm text-soft">
                Plus a team-practice track: weekly challenges to bring to the practices
                you already attend, so your team training builds the same habits.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {owned.has(featured.id) ? (
                <Link
                  href={`/program/${featured.id}`}
                  className="rounded-lg bg-cobalt px-8 py-3 font-semibold text-on-cobalt transition hover:bg-cobalt-hover"
                >
                  Open your program <span className="nudge">→</span>
                </Link>
              ) : (
                <BuyButton planId={featured.id} priceCents={featured.priceCents} />
              )}
              <span className="text-sm text-soft">
                14-day money-back guarantee · Lifetime access
              </span>
            </div>
          </section>
        ) : (
          <section className="mt-6 text-center">
            <h1 className="text-3xl display">8-Week Pro Programs</h1>
            <p className="mt-3 text-soft">
              <Link href="/quiz" className="text-cobalt underline">
                Take the free analysis
              </Link>{" "}
              to get the program matched to your playstyle.
            </p>
          </section>
        )}

        {rest.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold text-ink-2">
              {featured ? "Other programs" : "All programs"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((plan) => (
                <div key={plan.id} className="flex flex-col rounded-xl border border-rule bg-surface p-5">
                  <p className="text-sm text-soft">{plan.proPlayer.knownAs}</p>
                  <h3 className="mt-1 font-bold">{plan.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-soft">{plan.description}</p>
                  <div className="mt-4">
                    {owned.has(plan.id) ? (
                      <Link href={`/program/${plan.id}`} className="text-sm font-semibold text-cobalt">
                        Open program <span className="nudge">→</span>
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
