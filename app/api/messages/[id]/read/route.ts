import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/messageStatus";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const message = await prisma.message.findUnique({
    where: { id: params.id },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  if (effectiveStatus(message) !== "ARRIVED") {
    return NextResponse.json(
      { error: "Message has not arrived yet." },
      { status: 409 }
    );
  }

  const updated = await prisma.message.update({
    where: { id: params.id },
    data: {
      status: "ARRIVED",
      readAt: message.readAt ?? new Date(),
    },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    readAt: updated.readAt,
  });
}
