import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/messageStatus";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const message = await prisma.message.findUnique({
    where: { id: params.id },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const status = effectiveStatus(message);

  return NextResponse.json({
    id: message.id,
    status,
    chosenMethod: message.chosenMethod,
    arrivalAt: message.arrivalAt,
    createdAt: message.createdAt,
    readAt: message.readAt,
    body: status === "ARRIVED" ? message.body : null,
  });
}
