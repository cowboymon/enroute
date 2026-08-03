import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let payload: { senderName?: string; recipientName?: string; body?: string };
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

  const message = await prisma.message.create({
    data: {
      senderName,
      recipientName,
      body,
      status: "PENDING_CHOICE",
    },
  });

  return NextResponse.json({ id: message.id }, { status: 201 });
}
