import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let payload: { notifyContactType?: string; notifyContact?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const type = payload.notifyContactType;
  const contact = payload.notifyContact?.trim();

  if (type !== "email") {
    return NextResponse.json({ error: "notifyContactType must be email." }, { status: 400 });
  }
  if (!contact) {
    return NextResponse.json({ error: "notifyContact is required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(contact)) {
    return NextResponse.json({ error: "That doesn't look like a valid email." }, { status: 400 });
  }

  const message = await prisma.message.findUnique({ where: { id: params.id } });
  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const updated = await prisma.message.update({
    where: { id: params.id },
    data: {
      notifyOnArrival: true,
      notifyContactType: type,
      notifyContact: contact,
    },
  });

  return NextResponse.json({
    notifyOnArrival: updated.notifyOnArrival,
    notifyContactType: updated.notifyContactType,
  });
}
