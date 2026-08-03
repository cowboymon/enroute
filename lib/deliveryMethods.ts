export type DeliveryMethod = {
  id: string;
  label: string;
  /** human-readable duration range shown on the carrier card */
  speed: string;
  /** short personality blurb shown once a carrier is selected */
  copy: string;
  /** headline shown at the top of the transit chapter */
  headline: string;
  /** three progress-stage captions, keyed by elapsed-time bucket (<18%, <78%, rest) */
  progress: [string, string, string];
  /** field-note / "oddity" callouts, revealed as pct crosses each threshold in `events` */
  oddities: string[];
  /** elapsed-time thresholds (0-1) at which the next oddity in the list appears */
  events: number[];
  /** background image for the transit scene, served from /public */
  scene: string;
  /** sprite art for the carrier card + travelling marker, served from /public */
  sprite: string;
  /** true for carriers that travel through the air (used to pick the idle-bob animation) */
  air: boolean;
  /** accent color for the carrier's card, as a CSS color value */
  color: string;
  /** CSS class (see app/globals.css) for this carrier's reveal-chapter delivery stamp */
  deliveredBadgeClass: string;
  /**
   * Duration roll, in seconds. Either a flat [min, max] range (uniform roll)
   * or a weighted set of [min, max] ranges (e.g. the wombat mostly takes a
   * short trip, occasionally a very long one). Rolled exactly once,
   * server-side, at the moment the recipient chooses this method — see
   * rollDurationSeconds below and app/api/messages/[id]/choose/route.ts.
   */
  durationRoll:
    | { kind: "uniform"; minSeconds: number; maxSeconds: number }
    | { kind: "weighted"; buckets: { weight: number; minSeconds: number; maxSeconds: number }[] };
};

export const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: "wombat",
    label: "Wombat",
    speed: "20 min–12 hrs",
    copy: "Reliable, low to the ground, and personally offended by shortcuts.",
    headline: "The wombat has the address.",
    progress: ["Satchel fastened", "Taking the scenic route", "Snuffling nearby"],
    oddities: [
      "Has stopped to inspect a very convincing leaf.",
      "Is taking the tunnel. There was no tunnel before.",
      "Has rejected the official route on personal grounds.",
      "Moved the satchel to the other shoulder. Fresh start.",
    ],
    events: [0.04, 0.19, 0.58, 0.9],
    scene: "/bg/mountain-bg.png",
    sprite: "/characters/wombat.png",
    air: false,
    color: "oklch(84% .06 52)",
    deliveredBadgeClass: "delivered-special",
    durationRoll: {
      kind: "weighted",
      buckets: [
        { weight: 0.35, minSeconds: 20 * 60, maxSeconds: 60 * 60 },
        { weight: 0.4, minSeconds: 180 * 60, maxSeconds: 360 * 60 },
        { weight: 0.25, minSeconds: 480 * 60, maxSeconds: 720 * 60 },
      ],
    },
  },
  {
    id: "blimp",
    label: "Blimp",
    speed: "2–5 hrs",
    copy: "Grand entrance. Questionable steering. Immaculate tiny satchel.",
    headline: "The blimp is up and away.",
    progress: ["Casting off", "Drifting majestically", "Looking for somewhere to park"],
    oddities: [
      "Has caught a breeze with somewhere else to be.",
      "Is circling a cloud that looks exactly like a scone.",
      "Has lowered altitude to wave at a very small dog.",
      "Is pretending the headwind was part of the plan.",
    ],
    events: [0.06, 0.28, 0.7, 0.92],
    scene: "/bg/blimp-bg.png",
    sprite: "/characters/blimp.png",
    air: true,
    color: "oklch(88% .05 230)",
    deliveredBadgeClass: "delivered-generic",
    durationRoll: { kind: "uniform", minSeconds: 120 * 60, maxSeconds: 300 * 60 },
  },
  {
    id: "snail",
    label: "Snail",
    speed: "8–24 hrs",
    copy: "For messages that deserve a proper, theatrical amount of yearning.",
    headline: "The snail has begun its epic.",
    progress: ["One tiny foot forward", "Still absolutely moving", "Nearly at the garden gate"],
    oddities: [
      "Has travelled almost an entire leaf.",
      "Is taking a scheduled dew break.",
      "Has encountered a pebble and called it a mountain.",
      "Left a tiny note: still coming.",
    ],
    events: [0.03, 0.14, 0.52, 0.86],
    scene: "/bg/snail-bg.png",
    sprite: "/characters/snail.png",
    air: false,
    color: "oklch(86% .06 135)",
    deliveredBadgeClass: "delivered-snail",
    durationRoll: { kind: "uniform", minSeconds: 480 * 60, maxSeconds: 1440 * 60 },
  },
  {
    id: "pigeon",
    label: "Pigeon",
    speed: "30–90 mins",
    copy: "Street-smart air mail. One chip-related delay is included.",
    headline: "The pigeon knows a shortcut.",
    progress: ["Cleared for take-off", "Distracted by a chip", "Coming in hot"],
    oddities: [
      "Has stopped to judge a statue.",
      "Is negotiating with a chip. Terms remain unclear.",
      "Joined the wrong flock for six minutes.",
      "Can see the destination but prefers a dramatic approach.",
    ],
    events: [0.08, 0.31, 0.63, 0.91],
    scene: "/bg/sky-bg.png",
    sprite: "/characters/pigeon.png",
    air: true,
    color: "oklch(84% .055 255)",
    deliveredBadgeClass: "delivered-pigeon",
    durationRoll: { kind: "uniform", minSeconds: 30 * 60, maxSeconds: 90 * 60 },
  },
  {
    id: "donkey",
    label: "Donkey",
    speed: "4–8 hrs",
    copy: "Sure-footed, stubborn, and carrying your feelings like precious cargo.",
    headline: "The donkey is setting the pace.",
    progress: ["Saddled up", "Pausing for a think", "Clip-clopping closer"],
    oddities: [
      "Has stopped to admire the view. This is now a scenic pause.",
      "Has chosen a path that is technically not a path.",
      "Is clip-clopping to a distant accordion.",
      "Would like it noted that uphill builds character.",
    ],
    events: [0.05, 0.24, 0.66, 0.89],
    scene: "/bg/desert-bg.png",
    sprite: "/characters/donkey.png",
    air: false,
    color: "oklch(88% .07 82)",
    deliveredBadgeClass: "delivered-donkey",
    durationRoll: { kind: "uniform", minSeconds: 240 * 60, maxSeconds: 480 * 60 },
  },
  {
    id: "smoke",
    label: "Smoke signal",
    speed: "5–20 mins",
    copy: "Beautiful, mysterious, and extremely subject to wind conditions.",
    headline: "Your message is in the air.",
    progress: ["Fire lit", "Catching the breeze", "Visible on the horizon"],
    oddities: [
      "Has become briefly shaped like a teapot.",
      "Is waiting for the wind to finish changing its mind.",
      "Has been mistaken for weather.",
      "Is drifting in cursive now.",
    ],
    events: [0.1, 0.38, 0.73, 0.93],
    scene: "/bg/fire-bg.png",
    sprite: "/characters/smoke.png",
    air: true,
    color: "oklch(84% .07 25)",
    deliveredBadgeClass: "delivered-message",
    durationRoll: { kind: "uniform", minSeconds: 5 * 60, maxSeconds: 20 * 60 },
  },
  {
    id: "cat",
    label: "Kitty Cat",
    speed: "10 min–6 hrs",
    copy: "Nominally a courier. Mostly here for the box and the naps.",
    headline: "The cat has accepted the job. Mostly.",
    progress: ["Bag packed, reluctantly", "Somewhere, probably a sunbeam", "Nearing the good chair"],
    oddities: [
      "Has stopped to consider the box.",
      "Is now in the box. Delivery paused.",
      "Emerged from the box for a snack, delivery resumed.",
      "Has decided the rug is the destination.",
    ],
    events: [0.05, 0.22, 0.6, 0.9],
    scene: "/bg/livingroom-bg.png",
    sprite: "/characters/cat.png",
    air: false,
    color: "oklch(80% .01 250)",
    deliveredBadgeClass: "delivered-generic",
    durationRoll: { kind: "uniform", minSeconds: 10 * 60, maxSeconds: 360 * 60 },
  },
];

export function getDeliveryMethod(id: string): DeliveryMethod | undefined {
  return DELIVERY_METHODS.find((m) => m.id === id);
}

function randomBetween(minSeconds: number, maxSeconds: number): number {
  if (minSeconds >= maxSeconds) return minSeconds;
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
}

/**
 * Rolls a duration (in seconds) for the given method. This must only ever be
 * called server-side, once, at the moment the recipient chooses a method
 * (see app/api/messages/[id]/choose/route.ts) — the result is persisted as
 * `arrivalAt` and never re-rolled.
 */
export function rollDurationSeconds(method: DeliveryMethod): number {
  const roll = method.durationRoll;
  if (roll.kind === "uniform") {
    return randomBetween(roll.minSeconds, roll.maxSeconds);
  }
  const totalWeight = roll.buckets.reduce((sum, b) => sum + b.weight, 0);
  let pick = Math.random() * totalWeight;
  for (const bucket of roll.buckets) {
    if (pick < bucket.weight) {
      return randomBetween(bucket.minSeconds, bucket.maxSeconds);
    }
    pick -= bucket.weight;
  }
  const last = roll.buckets[roll.buckets.length - 1];
  return randomBetween(last.minSeconds, last.maxSeconds);
}
