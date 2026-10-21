"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Light/Dark switch. Light is the default; the choice is remembered per browser. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    if (next === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked (private mode); the switch still works for this visit.
    }
  }

  return (
    <div role="group" aria-label="Color theme" className="inline-flex gap-0.5 border border-rule bg-surface p-0.5 font-mono text-xs">
      {(["light", "dark"] as const).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={theme === t}
          onClick={() => choose(t)}
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
