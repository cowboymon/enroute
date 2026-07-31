import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let payload: { recipientEmail?: string; body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const recipientEmail = payload.recipientEmail?.trim();
  const body = payload.body?.trim();

  if (!recipientEmail || !body) {
    return NextResponse.json(
      { error: "recipientEmail and body are required." },
      { status: 400 }
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(recipientEmail)) {
    return NextResponse.json(
      { error: "recipientEmail must be a valid email address." },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      recipientEmail,
      body,
      status: "PENDING_CHOICE",
    },
  });

  return NextResponse.json({ id: message.id }, { status: 201 });
}
