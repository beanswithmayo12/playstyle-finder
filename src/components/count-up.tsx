"use client";

import { useEffect, useRef } from "react";

/**
 * A number that counts up from 0 after `delay` ms (flair 1). The final value
 * is what renders on the server and for visitors with reduced motion.
 */
export function CountUp({ value, delay = 0, duration = 1000 }: { value: number; delay?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now() + delay;
    el.textContent = "0";
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      el.textContent = String(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = String(value);
    };
  }, [value, delay, duration]);

  return <span ref={ref}>{value}</span>;
}
