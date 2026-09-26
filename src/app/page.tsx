import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { LandingUpload } from "@/components/landing-upload";

// Film-first landing: the drop zone is the hero, the quiz is the fallback for
// athletes without footage. Section structure: docs/05-monetization-ux.md
export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-sm font-semibold text-zinc-200">⚽ Playstyle Finder</span>
        <nav className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:text-zinc-50">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm font-medium text-zinc-300 hover:text-zinc-50">
              Dashboard
            </Link>
            <UserButton />
          </Show>
        </nav>
      </header>

      {/* Hero: upload first */}
      <section id="upload" className="mx-auto max-w-6xl scroll-mt-8 px-6 pb-24 pt-10 text-center sm:pt-16">
        <Pill>Free AI scouting report</Pill>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
          Which pro do <span className="text-emerald-400">you</span> play like?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
          Drop your highlight reel. Our AI scouts your game on film and matches
          you to the professional player whose style is closest to yours.
        </p>
        <div className="mt-10">
          <LandingUpload />
        </div>
      </section>

      {/* Feature: the match */}
      <section className="border-t border-zinc-900 bg-zinc-950">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
          <MatchPreview />
          <div>
            <Pill>Your game, decoded</Pill>
            <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Find your <span className="text-emerald-400">pro twin</span> from game film
            </h2>
            <p className="mt-4 text-lg font-semibold text-zinc-200">
              Scouted by AI · matched against 36 pros
            </p>
            <p className="mt-3 text-lg text-zinc-400">
              We score your game on 12 attributes and find the professional whose
              profile has the same shape — then explain the tactical why.
            </p>
            <CheckList
              items={[
                ["Built from your real footage", "Actions on film, not just how you describe yourself."],
                ["A scouting report, not a horoscope", "See which attributes drive the match, stat by stat."],
                ["Study film of your pro", "Curated clips with exactly what to watch for."],
              ]}
            />
          </div>
        </div>
      </section>

      {/* Feature: build + train */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
          <div className="lg:order-1">
            <Pill>Train with purpose</Pill>
            <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Build your <span className="text-emerald-400">99 OVR</span> self
            </h2>
            <p className="mt-4 text-lg font-semibold text-zinc-200">
              2K-style builder · 8-week pro programs
            </p>
            <p className="mt-3 text-lg text-zinc-400">
              Spend attribute points on the player you want to become, see the gap
              from where you are today, and close it with a program built around
              your pro.
            </p>
            <CheckList
              items={[
                ["Design your dream build", "Max your signature stats — live with the tradeoffs."],
                ["See the gap to your goal", "You today vs. your build, attribute by attribute."],
                ["Train like your match", "Periodized 8-week programs with drills, sets and cues."],
              ]}
            />
          </div>
          <div className="lg:order-2">
            <BuildPreview />
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="rounded-t-[3rem] bg-zinc-50 px-6 pb-12 pt-20 text-center text-zinc-950 sm:rounded-t-[6rem]">
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
          Ready to find your pro match?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-zinc-600">
          Upload your film or take the 3-minute quiz — your scouting report is free.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#upload"
            className="rounded-full bg-emerald-500 px-8 py-4 font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Upload my film
          </a>
          <Link
            href="/quiz"
            className="rounded-full border border-zinc-300 px-8 py-4 font-semibold text-zinc-800 transition hover:border-zinc-500"
          >
            Take the quiz
          </Link>
        </div>
        <p className="mt-16 text-xs text-zinc-400">⚽ Playstyle Finder</p>
      </section>
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-400">
      {children}
    </span>
  );
}

function CheckList({ items }: { items: [string, string][] }) {
  return (
    <ul className="mt-8 divide-y divide-zinc-800">
      {items.map(([title, body]) => (
        <li key={title} className="flex gap-3 py-5 first:pt-0">
          <svg viewBox="0 0 20 20" aria-hidden className="mt-0.5 h-6 w-6 shrink-0">
            <circle cx="10" cy="10" r="10" className="fill-emerald-500" />
            <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-lg font-semibold text-zinc-100">{title}</p>
            <p className="mt-1 text-zinc-400">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Illustrative product preview (static sample data, not a real user). */
function MatchPreview() {
  const bars: [string, number, number][] = [
    ["Dribbling", 84, 97],
    ["Explosiveness", 80, 97],
    ["Verticality", 77, 96],
  ];
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Your playstyle match</p>
          <p className="mt-2 text-3xl font-black text-emerald-400">Vinícius Jr.</p>
          <p className="mt-1 text-sm text-zinc-400">Explosive transitional winger</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-400">
            91% match
          </span>
          <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            🎬 Verified by film
          </span>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        {bars.map(([label, you, pro]) => (
          <div key={label}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-300">{label}</span>
              <span className="text-zinc-500">
                <span className="font-semibold text-emerald-400">{you}</span> / {pro}
              </span>
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-zinc-800">
              <div className="absolute h-2 rounded-full bg-zinc-600" style={{ width: `${pro}%` }} />
              <div className="absolute h-2 rounded-full bg-emerald-500" style={{ width: `${you}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 rounded-xl bg-zinc-950/60 p-4 text-sm leading-relaxed text-zinc-400">
        &ldquo;You hunt one-v-one isolations and attack the defender&apos;s front foot —
        the same vertical obsession that defines Vinícius&apos;s game.&rdquo;
      </p>
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
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <p className="font-bold">Your build</p>
        <div className="flex gap-2">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-center">
            <p className="text-2xl font-black text-emerald-400">94</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">OVR</p>
          </div>
          <div className="rounded-xl border border-zinc-700 px-4 py-2 text-center">
            <p className="text-2xl font-black">0</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">Pts left</p>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {stats.map(([label, val]) => (
          <div key={label}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-300">{label}</span>
              <span className={`font-bold ${val >= 90 ? "text-emerald-400" : "text-zinc-200"}`}>{val}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-zinc-800">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-xl bg-zinc-950/60 p-4">
        <div>
          <p className="text-xs text-zinc-500">Your build plays like</p>
          <p className="font-bold">Kevin De Bruyne</p>
        </div>
        <span className="text-lg font-black text-emerald-400">93%</span>
      </div>
    </div>
  );
}
