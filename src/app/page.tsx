import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

// Phase 0 placeholder landing page — the real marketing page ships in Phase 2
// with the quiz funnel. Structure and copy direction: docs/05-monetization-ux.md
export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-50">
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold text-zinc-300">⚽ Playstyle Finder</span>
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
            <UserButton />
          </Show>
        </nav>
      </header>
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
