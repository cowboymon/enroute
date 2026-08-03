import { Resend } from "resend";

let client: Resend | null | undefined;

function getClient(): Resend | null {
  if (client !== undefined) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    client = null;
    return client;
  }
  client = new Resend(apiKey);
  return client;
}

export async function sendArrivalNotification(
  to: string,
  opts: { recipientName?: string; senderName?: string; messageUrl: string }
): Promise<void> {
  const resend = getClient();
  if (!resend) {
    // No RESEND_API_KEY configured — no-op so the prototype still runs.
    console.log(`[email] Skipping arrival notification to ${to} (RESEND_API_KEY not set).`);
    return;
  }

  const { recipientName, senderName, messageUrl } = opts;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Enroute <onboarding@resend.dev>",
      to,
      subject: "Your message has arrived",
      text: `Hey ${recipientName || "there"},\n\n${
        senderName || "Someone"
      } sent you something and it just arrived. Go take a look:\n${messageUrl}\n\n— Enroute`,
    });
  } catch (err) {
    // Never let an email failure break the arrival flow.
    console.error("[email] Failed to send arrival notification:", err);
  }
}
