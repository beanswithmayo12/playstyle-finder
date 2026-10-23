"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuyButton({
  planId,
  priceCents,
  compact = false,
}: {
  planId: string;
  priceCents: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (res.status === 401) {
        router.push("/quiz");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  const price = `$${(priceCents / 100).toFixed(0)}`;

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={checkout}
        disabled={loading}
        className={
          compact
            ? "pop rounded-lg border border-cobalt/60 px-4 py-2 text-sm font-semibold text-cobalt transition hover:bg-cobalt/10 disabled:opacity-50"
            : "pop rounded-lg bg-cobalt px-8 py-3 font-semibold text-on-cobalt transition hover:bg-cobalt-hover disabled:opacity-50"
        }
      >
        {loading ? "Opening checkout…" : `Get the program — ${price}`}
      </button>
      {error && <span className="text-xs text-bad">{error}</span>}
    </div>
  );
}
