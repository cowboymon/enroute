import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContact(
  type: unknown,
  contact: unknown
): { type: string; contact: string } | null {
  if (type !== "email") return null;
  if (typeof contact !== "string") return null;
  const trimmed = contact.trim();
  if (!trimmed || !EMAIL_RE.test(trimmed)) return null;
  return { type, contact: trimmed };
}

export async function POST(req: NextRequest) {
  let payload: {
    senderName?: string;
    recipientName?: string;
    body?: string;
    recipientContactType?: string;
    recipientContact?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const senderName = payload.senderName?.trim();
  const recipientName = payload.recipientName?.trim();
  const body = payload.body?.trim();

  if (!senderName || !recipientName || !body) {
    return NextResponse.json(
      { error: "senderName, recipientName and body are required." },
      { status: 400 }
    );
  }

  const recipientContact = validateContact(
    payload.recipientContactType,
    payload.recipientContact
  );
  if (!recipientContact) {
    return NextResponse.json(
      { error: "A valid recipient email is required." },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      senderName,
      recipientName,
      body,
      status: "PENDING_CHOICE",
      recipientContactType: recipientContact.type,
      recipientContact: recipientContact.contact,
    },
  });

  // Fire the SENT event right away — carrier isn't known yet, so it's null.
  await prisma.messageEvent.create({
    data: { messageId: message.id, type: "SENT", carrier: null },
  });

  return NextResponse.json({ id: message.id }, { status: 201 });
}
