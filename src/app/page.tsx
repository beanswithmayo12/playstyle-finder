import Link from "next/link";
import { LandingUpload } from "@/components/landing-upload";
import { SiteHeader } from "@/components/site-header";
import { HeadToHead, Scoreboard } from "@/components/report";
import type { MetricVector } from "@/lib/metrics";

// Illustrative sample report for the marketing previews (not a real athlete).
const SAMPLE_YOU = { explosiveness: 80, dribbleDensity: 80, endurance: 46 } as unknown as MetricVector;
const SAMPLE_PRO = { explosiveness: 97, dribbleDensity: 97, endurance: 78 } as unknown as MetricVector;
const SAMPLE_MOMENTS: [string, string, string, boolean | null][] = [
  ["0:04", "Take-on", "beats his man outside", true],
  ["0:12", "Key pass", "through ball cut out", false],
  ["0:16", "Shot", "on target from the edge", true],
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero: upload first */}
        <section id="upload" className="mx-auto grid max-w-6xl scroll-mt-8 items-center gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.15fr_1fr] lg:pt-14">
          <div>
            <p className="label">Free scouting report</p>
            <h1 className="display mt-4 text-5xl sm:text-6xl xl:text-7xl">
              Same game. <span className="text-cobalt">Different stage.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-soft">
              Upload your highlights and meet the pro who plays like you. We tag
              every moment, put you head to head with the pros, and show you how
              to close the gap.
            </p>
            <div className="mt-8">
              <LandingUpload />
            </div>
          </div>
          <ReportPreview />
        </section>

        {/* Feature: film */}
        <section className="border-t border-rule bg-surface/60">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
            <MomentsPreview />
            <div>
              <p className="label">Film breakdown</p>
              <h2 className="display mt-4 text-4xl sm:text-5xl">Every moment, tagged.</h2>
              <p className="mt-4 text-lg text-soft">
                Our AI watches your reel and logs every take-on, key pass, shot and
                tackle, with whether it worked. Tap any moment to jump straight to it.
              </p>
              <CheckList
                items={[
                  ["Built from your real footage", "Actions on film, not just how you describe yourself."],
                  ["Head to head with your pro", "Your 12 attributes against theirs, side by side."],
                  ["A scouting report, not a horoscope", "See exactly which attributes drive your match."],
                ]}
              />
            </div>
          </div>
        </section>

        {/* Feature: build + train */}
        <section className="border-t border-rule">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
            <div>
              <p className="label">Train with purpose</p>
              <h2 className="display mt-4 text-4xl sm:text-5xl">Build your 99 OVR self.</h2>
              <p className="mt-4 text-lg text-soft">
                Spend attribute points on the player you want to become, see the gap
                from where you are today, and close it with a program built around
                your pro twin.
              </p>
              <CheckList
                items={[
                  ["Design your dream build", "Max your signature stats and live with the tradeoffs."],
                  ["Train on your own", "Eight-week programs with drills, sets and coaching cues."],
                  ["Train at team practice", "Weekly habits to bring to the practices you already go to."],
                ]}
              />
            </div>
            <BuildPreview />
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-film px-6 py-20 text-center text-film-ink">
          <p className="font-mono text-xs font-semibold tracking-[0.12em] text-film-accent uppercase">Free scouting report</p>
          <h2 className="display mx-auto mt-4 max-w-3xl text-5xl sm:text-6xl">Same game. Different stage.</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-film-soft">
            Upload your film or take the 3-minute quiz. Your report is free.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#upload" className="pop bg-film-accent px-7 py-3.5 font-semibold text-film transition hover:opacity-90">
              Find my pro twin <span className="nudge">→</span>
            </a>
            <Link href="/quiz" className="pop border border-film-rule px-7 py-3.5 font-semibold text-film-ink transition hover:border-film-accent">
              Take the quiz
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function CheckList({ items }: { items: [string, string][] }) {
  return (
    <ul className="mt-8 divide-y divide-rule border-y border-rule">
      {items.map(([title, body]) => (
        <li key={title} className="flex gap-3 py-4">
          <span aria-hidden className="mt-1 font-mono text-sm font-semibold text-cobalt">✓</span>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-0.5 text-soft">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SampleMoments() {
  return (
    <div className="bg-film p-4 text-film-ink">
      <p className="mb-2 font-mono text-xs font-semibold tracking-[0.12em] text-film-accent uppercase">Key moments</p>
      <ol>
        {SAMPLE_MOMENTS.map(([t, what, detail, ok], i) => (
          <li
            key={t}
            className={`grid grid-cols-[3rem_minmax(0,1fr)_1rem] items-center gap-3 border-b border-film-rule px-2 py-2 last:border-b-0 ${
              i === 2 ? "bg-film-accent/15 shadow-[inset_3px_0_0_var(--film-accent)]" : ""
            }`}
          >
            <span className="font-mono font-semibold text-film-accent">{t}</span>
            <span className="truncate"><b>{what}</b> <span className="text-film-soft">{detail}</span></span>
            <span className={ok ? "text-film-good" : "text-film-bad"}>{ok ? "✓" : "✗"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Illustrative product preview (sample data). */
function ReportPreview() {
  return (
    <div aria-hidden className="card pop grid rotate-[1.5deg] gap-4 p-5 transition [--pop-scale:1.02] shadow-[0_24px_48px_rgba(15,29,48,0.14)]">
      <div className="flex items-baseline justify-between font-mono text-xs text-soft">
        <span>PLAYER REPORT · SAMPLE</span>
        <span>film-verified</span>
      </div>
      <Scoreboard
        mini
        athlete={{ name: "Jordan", sub: "Player", ovr: 74 }}
        pro={{ name: "Vinícius Jr.", sub: "Pro twin", ovr: 91 }}
        matchPercent={93}
      />
      <HeadToHead
        athlete={SAMPLE_YOU}
        pro={SAMPLE_PRO}
        keys={["explosiveness", "dribbleDensity", "endurance"]}
        athleteName="Jordan"
        proName="Vinícius Jr."
      />
      <SampleMoments />
    </div>
  );
}

function MomentsPreview() {
  return (
    <div aria-hidden className="card lift p-5">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["1/2", "Take-ons made"], ["1/1", "Shots made"], ["0/1", "Key passes"], ["1", "Bursts"]].map(([v, l]) => (
          <div key={l} className="border border-rule p-3">
            <p className="font-mono text-xl font-semibold text-cobalt">{v}</p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-soft uppercase">{l}</p>
          </div>
        ))}
      </div>
      <SampleMoments />
    </div>
  );
}

function BuildPreview() {
  const stats: [string, number][] = [
    ["Passing", 99],
    ["Creation", 97],
    ["Scanning", 94],
    ["Tempo", 88],
    ["Duels", 52],
  ];
  return (
    <div aria-hidden className="card lift p-5">
      <div className="flex items-center justify-between">
        <p className="label">Your build</p>
        <div className="flex gap-2">
          <div className="bg-cobalt px-4 py-2 text-center text-on-cobalt">
            <p className="display text-2xl">94</p>
            <p className="font-mono text-[10px] tracking-[0.12em]">OVR</p>
          </div>
          <div className="border border-rule px-4 py-2 text-center">
            <p className="font-mono text-2xl font-semibold">0</p>
            <p className="font-mono text-[10px] tracking-[0.12em] text-soft">PTS LEFT</p>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {stats.map(([label, val]) => (
          <div key={label}>
            <div className="flex justify-between text-sm">
              <span>{label}</span>
              <span className={`font-mono font-semibold ${val >= 90 ? "text-cobalt" : ""}`}>{val}</span>
            </div>
            <div className="mt-1 h-2 bg-track">
              <div className="h-2 bg-ink" style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
        <div>
          <p className="font-mono text-xs text-soft">YOUR BUILD PLAYS LIKE</p>
          <p className="font-bold">Kevin De Bruyne</p>
        </div>
        <span className="font-mono text-lg font-semibold text-cobalt">93%</span>
      </div>
    </div>
  );
}
