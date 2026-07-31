import type { Message } from "@prisma/client";

/**
 * Computes the effective status of a message. A message stays IN_TRANSIT in
 * the database until it has actually been viewed post-arrival (see the
 * /read endpoint), but for display purposes it should behave as ARRIVED as
 * soon as arrivalAt has passed.
 */
export function effectiveStatus(message: Message): string {
  if (
    message.status === "IN_TRANSIT" &&
    message.arrivalAt &&
    message.arrivalAt.getTime() <= Date.now()
  ) {
    return "ARRIVED";
  }
  return message.status;
}
