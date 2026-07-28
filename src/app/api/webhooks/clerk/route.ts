/**
 * POST /api/webhooks/clerk — syncs Clerk users into our User table.
 * Configure in the Clerk dashboard: endpoint /api/webhooks/clerk, events
 * user.created / user.updated / user.deleted, secret → CLERK_WEBHOOK_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";

interface ClerkUserEvent {
  type: "user.created" | "user.updated" | "user.deleted" | string;
  data: {
    id: string;
    email_addresses?: { id: string; email_address: string }[];
    primary_email_address_id?: string;
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 500 });

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: ClerkUserEvent;
  try {
    event = new Webhook(secret).verify(payload, headers) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const email = event.data.email_addresses?.find(
        (e) => e.id === event.data.primary_email_address_id,
      )?.email_address;
      if (!email) break;

      await prisma.user.upsert({
        where: { clerkId: event.data.id },
        create: { clerkId: event.data.id, email },
        update: { email },
      });
      break;
    }
    case "user.deleted": {
      await prisma.user.deleteMany({ where: { clerkId: event.data.id } });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
