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
            ? "rounded-lg border border-emerald-500/60 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
            : "rounded-lg bg-emerald-500 px-8 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
        }
      >
        {loading ? "Opening checkout…" : `Get the program — ${price}`}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
