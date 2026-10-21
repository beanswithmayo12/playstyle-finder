"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { FLAIR } from "@/lib/flair";

type Theme = "light" | "dark";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

/**
 * Light/Dark switch. Light is the default; the choice is remembered per
 * browser. With flair 8 the new theme spreads out in a circle from the toggle.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    if (next === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked (private mode); the switch still works for this visit.
    }
  }

  function choose(next: Theme, e: MouseEvent<HTMLButtonElement>) {
    if (next === theme) return;
    const doc = document as ViewTransitionDocument;
    if (
      !FLAIR.floodlightTheme ||
      !doc.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply(next);
      return;
    }
    // Keyboard clicks report 0,0: start from the button's centre instead.
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || box.left + box.width / 2;
    const y = e.clientY || box.top + box.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = doc.startViewTransition(() => flushSync(() => apply(next)));
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 650, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
  }

  return (
    <div role="group" aria-label="Color theme" className="inline-flex gap-0.5 border border-rule bg-surface p-0.5 font-mono text-xs">
      {(["light", "dark"] as const).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={theme === t}
          onClick={(e) => choose(t, e)}
          className={`px-2.5 py-1 transition ${
            theme === t ? "bg-ink text-paper" : "text-soft hover:text-ink"
          }`}
        >
          {t === "light" ? "☀ Light" : "☾ Dark"}
        </button>
      ))}
    </div>
  );
}
