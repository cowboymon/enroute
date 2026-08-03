import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/messageStatus";
import { sendArrivalNotification } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const message = await prisma.message.findUnique({
    where: { id: params.id },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const status = effectiveStatus(message);

  // Fire the arrival notification exactly once, the first time anyone
  // observes an ARRIVED message that hasn't been notified yet.
  if (
    status === "ARRIVED" &&
    message.notifyOnArrival &&
    !message.notifiedAt
  ) {
    if (message.notifyContactType === "email" && message.notifyContact) {
      const messageUrl = `${req.nextUrl.origin}/m/${message.id}`;
      await sendArrivalNotification(message.notifyContact, {
        recipientName: message.recipientName,
        senderName: message.senderName,
        messageUrl,
      });
      await prisma.message.update({
        where: { id: message.id },
        data: { notifiedAt: new Date() },
      });
    } else if (message.notifyContactType === "mobile") {
      // SMS isn't wired up yet — no provider integrated. Mark as notified
      // so we don't keep re-checking, but nothing is actually sent.
      await prisma.message.update({
        where: { id: message.id },
        data: { notifiedAt: new Date() },
      });
    }
  }

  return NextResponse.json({
    id: message.id,
    status,
    senderName: message.senderName,
    recipientName: message.recipientName,
    chosenMethod: message.chosenMethod,
    arrivalAt: message.arrivalAt,
    createdAt: message.createdAt,
    readAt: message.readAt,
    notifyOnArrival: message.notifyOnArrival,
    notifyContactType: message.notifyContactType,
    body: status === "ARRIVED" ? message.body : null,
  });
}
