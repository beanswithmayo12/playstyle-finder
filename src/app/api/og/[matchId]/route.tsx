/**
 * GET /api/og/[matchId] — the shareable match card image (1200×630),
 * rendered for social embeds of the public share page /m/[matchId].
 */

import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { displayMatchPercent } from "@/lib/matching";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const match = await prisma.matchResult.findUnique({
    where: { id: matchId },
    include: { proPlayer: true },
  });
  if (!match) return new Response("Not found", { status: 404 });

  const pct = displayMatchPercent(match.similarity);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          color: "#0f1d30",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#5b6b7d" }}>
          Playstyle Finder
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#1e4fd8",
          }}
        >
          Playstyle match
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 88,
            fontWeight: 800,
            color: "#0f1d30",
          }}
        >
          {match.proPlayer.knownAs}
        </div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 34, color: "#2a3a52" }}>
          {match.proPlayer.archetype}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            padding: "14px 40px",
            border: "2px solid #1e4fd8",
            backgroundColor: "#1e4fd8",
            fontSize: 40,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          {pct}% style match
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 24, color: "#5b6b7d" }}>
          Same game. Different stage. Find your pro twin, free.
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
