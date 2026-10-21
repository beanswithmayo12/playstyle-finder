import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

/**
 * The one header every page uses: brand (or a back link), the theme switch,
 * and the account controls.
 */
export function SiteHeader({
  back,
  width = "max-w-6xl",
}: {
  back?: { href: string; label: string };
  width?: string;
}) {
  return (
    <header className={`mx-auto flex w-full ${width} items-center justify-between gap-4 px-6 py-5`}>
      {back ? (
        <Link href={back.href} className="text-sm font-semibold text-ink-2 hover:text-cobalt">
          ← {back.label}
        </Link>
      ) : (
        <Link href="/" className="font-bold [font-stretch:112%]">
          Playstyle Finder
        </Link>
      )}
      <nav className="flex items-center gap-3">
        <ThemeToggle />
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="px-2 py-2 text-sm font-medium text-soft transition hover:text-ink">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="border border-rule-strong px-3 py-1.5 text-sm font-semibold transition hover:border-cobalt hover:text-cobalt">
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Link href="/dashboard" className="hidden text-sm font-medium text-soft hover:text-ink sm:inline">
            Dashboard
          </Link>
          <UserButton />
        </Show>
      </nav>
    </header>
  );
}
