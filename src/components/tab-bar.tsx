"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

export interface TabDef {
  id: string;
  label: string;
  /** Small mono note after the label, e.g. a gap to close. */
  hint?: string;
}

/**
 * Sticky tab bar with a sliding cobalt underline. Arrow keys move between
 * tabs. Panels are rendered by the parent; give each one
 * id={`panel-${tab.id}`} and aria-labelledby={`tab-${tab.id}`}.
 */
export function TabBar({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[active];
      if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  // Keep the active tab in view when the bar scrolls sideways on narrow screens.
  useEffect(() => {
    refs.current[active]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="relative flex overflow-x-auto border-b border-rule [scrollbar-width:none]"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          id={`tab-${t.id}`}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          className={`flex shrink-0 items-baseline gap-2 px-4 py-3.5 font-mono text-xs font-semibold tracking-[0.1em] whitespace-nowrap uppercase transition-colors ${
            active === t.id ? "text-ink" : "text-soft hover:text-ink"
          }`}
        >
          {t.label}
          {t.hint && <span className="font-medium tracking-normal text-pen normal-case">{t.hint}</span>}
        </button>
      ))}
      {bar && (
        <span
          aria-hidden
          className="absolute bottom-0 h-[3px] bg-cobalt transition-[left,width] duration-300 ease-out"
          style={{ left: bar.left, width: bar.width }}
        />
      )}
    </div>
  );
}
