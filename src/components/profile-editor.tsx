"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ProfileState {
  slug: string | null;
  published: boolean;
  gradYear: number | null;
  team: string;
  location: string;
  heightCm: number | null;
  bio: string;
  contactEmail: string;
  featuredAssessmentId: string | null;
}

const input =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none";

export function ProfileEditor({
  initial,
  reels,
  hasAnalysis,
  displayName,
}: {
  initial: ProfileState;
  reels: { id: string; label: string }[];
  hasAnalysis: boolean;
  displayName: string;
}) {
  const [p, setP] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof ProfileState>(k: K, v: ProfileState[K]) => {
    setP((prev) => ({ ...prev, [k]: v }));
    setMessage(null);
  };

  // Origin is only known in the browser; reading it in an effect keeps the
  // server render and first client render identical.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const shareUrl = p.slug && origin ? `${origin}/p/${p.slug}` : null;

  async function save(published: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "could not save");
      setP((prev) => ({ ...prev, slug: data.slug, published: data.published }));
      setMessage({
        ok: true,
        text: data.published ? "Published — anyone with the link can view it." : "Saved as private.",
      });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      {!hasAnalysis && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Your profile shows your ratings and pro match, so you&apos;ll need one analysis
          (film or quiz) before you can publish.
        </p>
      )}

      <p className="text-sm text-zinc-500">
        Name shown: <span className="text-zinc-300">{displayName}</span> (from your account)
      </p>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Graduation year</span>
          <input
            type="number"
            value={p.gradYear ?? ""}
            onChange={(e) => set("gradYear", e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. 2028"
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Height (cm)</span>
          <input
            type="number"
            value={p.heightCm ?? ""}
            onChange={(e) => set("heightCm", e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. 175"
            className={input}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-300">Current team</span>
        <input value={p.team} onChange={(e) => set("team", e.target.value)} placeholder="e.g. Lincoln High / FC Metro U17" className={input} />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-300">Location</span>
        <input value={p.location} onChange={(e) => set("location", e.target.value)} placeholder="City, state — no street address" className={input} />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-300">About you</span>
        <textarea
          value={p.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={4}
          maxLength={600}
          placeholder="Your game in a few sentences — what coaches should know."
          className={input}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-300">Featured highlight reel</span>
        {reels.length > 0 ? (
          <select
            value={p.featuredAssessmentId ?? ""}
            onChange={(e) => set("featuredAssessmentId", e.target.value || null)}
            className={input}
          >
            <option value="">No film on my profile</option>
            {reels.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-zinc-500">
            No analyzed reels yet —{" "}
            <Link href="/upload" className="text-emerald-400 underline">
              upload one
            </Link>{" "}
            to showcase your film.
          </p>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-300">Contact email (optional)</span>
        <input
          type="email"
          value={p.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
          placeholder="Under 18? Use a parent's or coach's email"
          className={input}
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Shown as a Contact button on your public page. Leave blank to hide it.
        </span>
      </label>

      {message && <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-900 pt-5">
        <button
          onClick={() => save(true)}
          disabled={saving || !hasAnalysis}
          className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
        >
          {p.published ? "Save & keep public" : "Publish profile"}
        </button>
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 transition hover:border-zinc-500 disabled:opacity-40"
        >
          {p.published ? "Make private" : "Save as private"}
        </button>
        {p.slug && (
          <Link href={`/p/${p.slug}`} className="text-sm text-zinc-400 underline hover:text-zinc-200">
            {p.published ? "View public page" : "Preview"}
          </Link>
        )}
      </div>

      {p.published && shareUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <code className="min-w-0 flex-1 truncate text-sm text-zinc-300">{shareUrl}</code>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="shrink-0 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold transition hover:border-emerald-500"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
