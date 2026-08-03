import { prisma } from "@/lib/prisma";
import { DELIVERY_METHODS } from "@/lib/deliveryMethods";

const CARRIER_IDS = DELIVERY_METHODS.map((m) => m.id);

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function zeroedCarrierRecord(): Record<string, number> {
  return Object.fromEntries(CARRIER_IDS.map((id) => [id, 0]));
}

/** Promised [min, max] seconds for a carrier, flattened across weighted buckets. */
function promisedRange(carrierId: string): { minSeconds: number; maxSeconds: number } | null {
  const method = DELIVERY_METHODS.find((m) => m.id === carrierId);
  if (!method) return null;
  const roll = method.durationRoll;
  if (roll.kind === "uniform") {
    return { minSeconds: roll.minSeconds, maxSeconds: roll.maxSeconds };
  }
  const minSeconds = Math.min(...roll.buckets.map((b) => b.minSeconds));
  const maxSeconds = Math.max(...roll.buckets.map((b) => b.maxSeconds));
  return { minSeconds, maxSeconds };
}

export type StatsResponse = {
  allTimeSendCount: number;
  todaySendCount: number;
  allTimeSendCountByCarrier: Record<string, number>;
  todaySendCountByCarrier: Record<string, number>;
  currentlyEnRouteCount: number;
  avgTransitSecondsByCarrier: Record<
    string,
    { avgActualSeconds: number | null; promisedMinSeconds: number; promisedMaxSeconds: number; sampleSize: number } | null
  >;
  carrierPopularity: {
    today: Record<string, number>; // percentage of today's sends, 0-100
    allTime: Record<string, number>; // percentage of all-time sends, 0-100
    trendingCarrier: string | null;
  };
  records: {
    fastestDeliveryToday: { carrier: string; transitSeconds: number } | null;
    longestMessageStillInFlight: { carrier: string; secondsInTransitSoFar: number } | null;
    longestCarrierStreak: { senderContact: string; carrier: string; streak: number } | null;
  };
  timeOfDay: Record<string, number[]>; // carrier -> 24 hourly counts
};

export async function getStats(): Promise<StatsResponse> {
  const today = startOfToday();
  const now = new Date();

  const [allTimeSendCount, todaySendCount] = await Promise.all([
    prisma.messageEvent.count({ where: { type: "SENT" } }),
    prisma.messageEvent.count({ where: { type: "SENT", createdAt: { gte: today } } }),
  ]);

  // Per-carrier send breakdowns are derived from Message.chosenMethod (the
  // SENT event itself has no carrier yet, since it fires before choice) —
  // this only counts messages that have since picked a carrier, which is
  // the best available proxy for a prototype.
  const [allTimeChosen, todayChosen] = await Promise.all([
    prisma.message.groupBy({
      by: ["chosenMethod"],
      where: { chosenMethod: { not: null } },
      _count: { _all: true },
    }),
    prisma.message.groupBy({
      by: ["chosenMethod"],
      where: { chosenMethod: { not: null }, createdAt: { gte: today } },
      _count: { _all: true },
    }),
  ]);

  const allTimeSendCountByCarrier = zeroedCarrierRecord();
  for (const row of allTimeChosen) {
    if (row.chosenMethod) allTimeSendCountByCarrier[row.chosenMethod] = row._count._all;
  }
  const todaySendCountByCarrier = zeroedCarrierRecord();
  for (const row of todayChosen) {
    if (row.chosenMethod) todaySendCountByCarrier[row.chosenMethod] = row._count._all;
  }

  const currentlyEnRouteCount = await prisma.message.count({
    where: { status: "IN_TRANSIT", arrivalAt: { gt: now } },
  });

  const deliveredEvents = await prisma.messageEvent.findMany({
    where: { type: "DELIVERED" },
    select: { carrier: true, transitSeconds: true, createdAt: true },
  });

  const avgTransitSecondsByCarrier: StatsResponse["avgTransitSecondsByCarrier"] = {};
  for (const carrierId of CARRIER_IDS) {
    const range = promisedRange(carrierId);
    const rows = deliveredEvents.filter(
      (e) => e.carrier === carrierId && typeof e.transitSeconds === "number"
    );
    if (!range) {
      avgTransitSecondsByCarrier[carrierId] = null;
      continue;
    }
    const avgActualSeconds =
      rows.length > 0
        ? Math.round(rows.reduce((sum, r) => sum + (r.transitSeconds ?? 0), 0) / rows.length)
        : null;
    avgTransitSecondsByCarrier[carrierId] = {
      avgActualSeconds,
      promisedMinSeconds: range.minSeconds,
      promisedMaxSeconds: range.maxSeconds,
      sampleSize: rows.length,
    };
  }

  // Carrier popularity: % of sends today vs all-time, by carrier.
  const totalAllTime = Object.values(allTimeSendCountByCarrier).reduce((a, b) => a + b, 0);
  const totalToday = Object.values(todaySendCountByCarrier).reduce((a, b) => a + b, 0);
  const popularityAllTime = zeroedCarrierRecord();
  const popularityToday = zeroedCarrierRecord();
  for (const carrierId of CARRIER_IDS) {
    popularityAllTime[carrierId] =
      totalAllTime > 0 ? (allTimeSendCountByCarrier[carrierId] / totalAllTime) * 100 : 0;
    popularityToday[carrierId] =
      totalToday > 0 ? (todaySendCountByCarrier[carrierId] / totalToday) * 100 : 0;
  }
  let trendingCarrier: string | null = null;
  let bestGain = 0;
  for (const carrierId of CARRIER_IDS) {
    const gain = popularityToday[carrierId] - popularityAllTime[carrierId];
    if (gain > bestGain) {
      bestGain = gain;
      trendingCarrier = carrierId;
    }
  }

  // Records.
  const fastestToday = deliveredEvents
    .filter((e) => e.createdAt >= today && typeof e.transitSeconds === "number" && e.carrier)
    .sort((a, b) => (a.transitSeconds ?? Infinity) - (b.transitSeconds ?? Infinity))[0];
  const fastestDeliveryToday = fastestToday
    ? { carrier: fastestToday.carrier as string, transitSeconds: fastestToday.transitSeconds as number }
    : null;

  const inFlight = await prisma.message.findMany({
    where: { status: "IN_TRANSIT", arrivalAt: { gt: now }, chosenMethod: { not: null } },
    select: { chosenMethod: true, chosenAt: true, createdAt: true },
  });
  let longestMessageStillInFlight: StatsResponse["records"]["longestMessageStillInFlight"] = null;
  for (const m of inFlight) {
    const startedAt = m.chosenAt ?? m.createdAt;
    const secondsInTransitSoFar = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));
    if (
      !longestMessageStillInFlight ||
      secondsInTransitSoFar > longestMessageStillInFlight.secondsInTransitSoFar
    ) {
      longestMessageStillInFlight = { carrier: m.chosenMethod as string, secondsInTransitSoFar };
    }
  }

  // Longest same-carrier streak by the same sender, scanning a reasonably
  // bounded window of recent messages (prototype-simple, no raw SQL).
  const recentBySender = await prisma.message.findMany({
    where: { senderContact: { not: null }, chosenMethod: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { senderContact: true, chosenMethod: true, createdAt: true },
    take: 2000,
  });
  const bySender = new Map<string, { chosenMethod: string; createdAt: Date }[]>();
  for (const m of recentBySender) {
    if (!m.senderContact || !m.chosenMethod) continue;
    const list = bySender.get(m.senderContact) ?? [];
    list.push({ chosenMethod: m.chosenMethod, createdAt: m.createdAt });
    bySender.set(m.senderContact, list);
  }
  let longestCarrierStreak: StatsResponse["records"]["longestCarrierStreak"] = null;
  for (const [senderContact, list] of bySender) {
    let runCarrier: string | null = null;
    let runLength = 0;
    for (const item of list) {
      if (item.chosenMethod === runCarrier) {
        runLength += 1;
      } else {
        runCarrier = item.chosenMethod;
        runLength = 1;
      }
      if (runCarrier && (!longestCarrierStreak || runLength > longestCarrierStreak.streak)) {
        longestCarrierStreak = { senderContact, carrier: runCarrier, streak: runLength };
      }
    }
  }

  // Time-of-day distribution, per carrier, over all messages that picked one.
  const timeOfDay: Record<string, number[]> = Object.fromEntries(
    CARRIER_IDS.map((id) => [id, new Array(24).fill(0)])
  );
  const allChosenMessages = await prisma.message.findMany({
    where: { chosenMethod: { not: null } },
    select: { chosenMethod: true, createdAt: true },
  });
  for (const m of allChosenMessages) {
    if (!m.chosenMethod || !(m.chosenMethod in timeOfDay)) continue;
    const hour = m.createdAt.getHours();
    timeOfDay[m.chosenMethod][hour] += 1;
  }

  return {
    allTimeSendCount,
    todaySendCount,
    allTimeSendCountByCarrier,
    todaySendCountByCarrier,
    currentlyEnRouteCount,
    avgTransitSecondsByCarrier,
    carrierPopularity: {
      today: popularityToday,
      allTime: popularityAllTime,
      trendingCarrier,
    },
    records: {
      fastestDeliveryToday,
      longestMessageStillInFlight,
      longestCarrierStreak,
    },
    timeOfDay,
  };
}
