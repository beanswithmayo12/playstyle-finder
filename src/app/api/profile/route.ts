/**
 * POST /api/profile — create or update the athlete's recruiting profile.
 * Body: { published, gradYear, team, location, heightCm, bio, contactEmail,
 *         featuredAssessmentId }. All fields optional except published.
 */

import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/users";

interface ProfileBody {
  published?: boolean;
  gradYear?: number | null;
  team?: string | null;
  location?: string | null;
  heightCm?: number | null;
  bio?: string | null;
  contactEmail?: string | null;
  featuredAssessmentId?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const session = await ensureUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { user, displayName } = session;

  const body = (await req.json()) as ProfileBody;
  const text = (v: string | null | undefined, max: number) => {
    const t = v?.trim();
    return t ? t.slice(0, max) : null;
  };

  const gradYear = body.gradYear ?? null;
  const thisYear = new Date().getFullYear();
  if (gradYear !== null && (!Number.isInteger(gradYear) || gradYear < thisYear - 10 || gradYear > thisYear + 10)) {
    return NextResponse.json({ error: "graduation year looks off" }, { status: 400 });
  }
  const heightCm = body.heightCm ?? null;
  if (heightCm !== null && (!Number.isInteger(heightCm) || heightCm < 100 || heightCm > 230)) {
    return NextResponse.json({ error: "height should be in centimeters (100–230)" }, { status: 400 });
  }
  const contactEmail = text(body.contactEmail, 200);
  if (contactEmail && !EMAIL_RE.test(contactEmail)) {
    return NextResponse.json({ error: "contact email isn't valid" }, { status: 400 });
  }

  const featuredAssessmentId = body.featuredAssessmentId || null;
  if (featuredAssessmentId) {
    const owned = await prisma.assessment.findFirst({
      where: {
        id: featuredAssessmentId,
        userId: user.id,
        status: "COMPLETE",
        inputType: { in: ["VIDEO", "HYBRID"] },
      },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: "pick one of your analyzed reels" }, { status: 400 });
  }

  const hasMatch = await prisma.assessment.count({ where: { userId: user.id, status: "COMPLETE" } });
  if (body.published && hasMatch === 0) {
    return NextResponse.json(
      { error: "get your first analysis before publishing — the profile shows your ratings" },
      { status: 400 },
    );
  }

  const fields = {
    published: !!body.published,
    gradYear,
    team: text(body.team, 100),
    location: text(body.location, 100),
    heightCm,
    bio: text(body.bio, 600),
    contactEmail,
    featuredAssessmentId,
  };

  const profile = await prisma.recruitingProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, slug: makeSlug(displayName), ...fields },
    update: fields,
  });

  return NextResponse.json({ slug: profile.slug, published: profile.published });
}

/** "Jordan B." → "jordan-b-k3f9" — random suffix keeps URLs unguessable-ish and unique. */
function makeSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .slice(0, 30) || "player";
  return `${base}-${randomBytes(3).toString("hex")}`;
}
