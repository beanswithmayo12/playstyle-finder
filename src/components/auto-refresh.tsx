"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-runs the server component on an interval (e.g. while film processes). */
export function AutoRefresh({ everyMs = 5000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(t);
  }, [router, everyMs]);
  return null;
}
