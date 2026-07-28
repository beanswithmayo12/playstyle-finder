import Link from "next/link";

// Phase 0 placeholder landing page — the real marketing page ships in Phase 2
// with the quiz funnel. Structure and copy direction: docs/05-monetization-ux.md
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-50">
      <p className="mb-4 rounded-full border border-zinc-700 px-4 py-1 text-sm text-zinc-400">
        ⚽ Playstyle Finder
      </p>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
        Which pro do <span className="text-emerald-400">you</span> play like?
      </h1>
      <p className="mt-6 max-w-xl text-lg text-zinc-400">
        Answer a 3-minute questionnaire — or upload your highlights — and our AI
        matches your playstyle to a professional player. Then train like them.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/quiz"
          className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Find my match
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-300 transition hover:border-zinc-500"
        >
          My dashboard
        </Link>
      </div>
      <p className="mt-8 text-sm text-zinc-600">Free analysis · No card required</p>
    </main>
  );
}
