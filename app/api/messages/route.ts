import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose international-friendly phone matcher: digits, spaces, dashes,
// parens, optional leading +, 7-15 digits total.
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

function validateContact(
  type: unknown,
  contact: unknown
): { type: string; contact: string } | null {
  if (type !== "email" && type !== "mobile") return null;
  if (typeof contact !== "string") return null;
  const trimmed = contact.trim();
  if (!trimmed) return null;
  if (type === "email" && !EMAIL_RE.test(trimmed)) return null;
  if (type === "mobile" && !PHONE_RE.test(trimmed)) return null;
  return { type, contact: trimmed };
}

export async function POST(req: NextRequest) {
  let payload: {
    senderName?: string;
    recipientName?: string;
    body?: string;
    senderContactType?: string;
    senderContact?: string;
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
      { error: "A valid recipient email or mobile number is required." },
      { status: 400 }
    );
  }

  const senderContact = validateContact(payload.senderContactType, payload.senderContact);
  if (!senderContact) {
    return NextResponse.json(
      { error: "A valid sender email or mobile number is required." },
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
      senderContactType: senderContact.type,
      senderContact: senderContact.contact,
    },
  });

  return NextResponse.json({ id: message.id }, { status: 201 });
}
