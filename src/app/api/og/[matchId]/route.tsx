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
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa" }}>
          ⚽ Playstyle Finder
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#71717a",
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
            color: "#34d399",
          }}
        >
          {match.proPlayer.knownAs}
        </div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 34, color: "#d4d4d8" }}>
          {match.proPlayer.archetype}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            padding: "14px 40px",
            borderRadius: 999,
            border: "2px solid #10b98166",
            backgroundColor: "#10b9811a",
            fontSize: 40,
            fontWeight: 700,
            color: "#34d399",
          }}
        >
          {pct}% style match
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 24, color: "#71717a" }}>
          Which pro does YOUR game match? Free 3-minute analysis.
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
