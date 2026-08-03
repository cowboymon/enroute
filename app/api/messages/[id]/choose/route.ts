import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliveryMethod, rollDurationSeconds } from "@/lib/deliveryMethods";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let payload: { methodId?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const method = payload.methodId ? getDeliveryMethod(payload.methodId) : undefined;
  if (!method) {
    return NextResponse.json({ error: "Unknown methodId." }, { status: 400 });
  }

  const message = await prisma.message.findUnique({
    where: { id: params.id },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  if (message.status !== "PENDING_CHOICE") {
    return NextResponse.json(
      { error: "A delivery method has already been chosen for this message." },
      { status: 409 }
    );
  }

  const durationSeconds = rollDurationSeconds(method);
  const arrivalAt = new Date(Date.now() + durationSeconds * 1000);

  const updated = await prisma.message.update({
    where: { id: params.id },
    data: {
      chosenMethod: method.id,
      chosenAt: new Date(),
      arrivalAt,
      status: "IN_TRANSIT",
    },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    chosenMethod: updated.chosenMethod,
    arrivalAt: updated.arrivalAt,
  });
}
