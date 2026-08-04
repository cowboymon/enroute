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
  /** elapsed-time thresholds (0-1) at which the sprite briefly swaps to its "observing" frame */
  events: number[];
  /** shown right when transit starts (pct ~ 0) */
  dispatchLines: string[];
  /** shown through the middle stretch of the journey */
  midTransitLines: string[];
  /** shown as the carrier is nearly there */
  nearArrivalLines: string[];
  /** shown on the reveal chapter, alongside/instead of `copy` — one is picked at random per view */
  deliveredLines: string[];
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
    events: [0.04, 0.19, 0.58, 0.9],
    dispatchLines: [
      "Satchel checked twice. Unbothered by the deadline.",
      "Route reviewed. Already has other ideas.",
      "Departure logged. Already off-script.",
      "Satchel adjusted one final time. This is happening.",
      "Route noted, then quietly disregarded.",
    ],
    midTransitLines: [
      "Has stopped to inspect a very convincing leaf.",
      "Is taking the tunnel. There was no tunnel before.",
      "Has rejected the official route on personal grounds.",
      "Has moved the satchel to the other shoulder. Fresh start.",
      "Is digging. This may or may not be relevant to the delivery.",
      "Has paused to stare at nothing in particular, meaningfully.",
      "Is backtracking. Calls it \"reconsidering.\"",
      "Has found a shortcut that is objectively longer.",
      "Is following a smell instead of the map.",
      "Has stopped to sit in a puddle, on purpose.",
      "Is convinced this is faster. It is not.",
      "Has paused to greet a rock like an old friend.",
      "Is walking backwards for a bit. Unclear why.",
      "Has taken a nap. The satchel did not.",
    ],
    nearArrivalLines: [
      "Recognizes this street. Mildly smug about it.",
      "Has stopped dawdling. Suspiciously close now.",
      "Is walking with sudden, unexplained purpose.",
      "So close now. Taking its time anyway.",
      "Is definitely almost there, probably.",
      "Has stopped acting lost. Progress.",
    ],
    deliveredLines: [
      "Arrived exactly when it wanted to, which was now.",
      "Delivered. Already forgot why it hurried at the end.",
      "Arrived, dropped the satchel, claimed victory.",
      "Delivered. Immediately lay down in triumph.",
      "Arrived, satchel slightly worse for wear, spirit unbothered.",
    ],
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
    events: [0.06, 0.28, 0.7, 0.92],
    dispatchLines: [
      "Ropes cast off. Tiny satchel immaculate as promised.",
      "Ballast checked. Flight plan optional.",
      "Ascending gently. Confidence: high. Accuracy: TBD.",
      "Engines humming. Optimism: high.",
      "Cast off into the wind, bravely, sort of.",
    ],
    midTransitLines: [
      "Has caught a breeze with somewhere else to be.",
      "Is circling a cloud that looks exactly like a scone.",
      "Has lowered altitude to wave at a very small dog.",
      "Is pretending the headwind was part of the plan.",
      "Has drifted slightly off course, majestically.",
      "Is admiring its own reflection in a pond, upside down.",
      "Has been briefly distracted by a second, lesser blimp.",
      "Is adjusting course using vibes alone.",
      "Has taken a scenic detour around absolutely nothing.",
      "Is chasing a bird it cannot possibly catch.",
      "Has dipped low enough to hear a lawnmower.",
      "Is drifting sideways with total serenity.",
      "Has mistaken a water tower for the destination, briefly.",
      "Is coasting along, barely trying.",
    ],
    nearArrivalLines: [
      "Beginning its descent. Steering still questionable.",
      "Has spotted the landing zone and is aiming approximately at it.",
      "Is losing altitude with great dignity.",
      "Nearly there, in a very roundabout, very scenic way.",
      "Is descending in a slow, confident spiral.",
      "Close now. Refusing to rush anyway.",
    ],
    deliveredLines: [
      "Touched down with unearned confidence and total success.",
      "Landed. Somehow exactly on target.",
      "Docked, deflated slightly, thoroughly pleased with itself.",
      "Settled down gently, like it meant to the whole time.",
      "Landed, bounced once, called it intentional.",
    ],
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
    events: [0.03, 0.14, 0.52, 0.86],
    dispatchLines: [
      "First tiny foot forward. The yearning begins.",
      "Trail glistening. Departure achieved, technically.",
      "Setting off. Speed was never the plan.",
      "Antennae up. Pace pre-committed.",
      "Departed. Arrival scheduled for eventually.",
    ],
    midTransitLines: [
      "Has travelled almost an entire leaf.",
      "Is taking a scheduled dew break.",
      "Has encountered a pebble and called it a mountain.",
      "Left a tiny note: still coming.",
      "Is pausing to reflect on the journey so far.",
      "Has made peace with the concept of time.",
      "Is inching forward with real commitment.",
      "Has stopped to admire its own trail.",
      "Is contemplating a blade of grass, deeply.",
      "Has slid sideways for a change of scenery.",
      "Is pausing to let a beetle pass. Professional courtesy.",
      "Has left another note: still, still coming.",
      "Is resting, which also counts as travel.",
      "Has decided the shade is worth the delay.",
    ],
    nearArrivalLines: [
      "The garden gate is, theoretically, visible.",
      "Picking up what can only be described as a slight pace.",
      "Is almost there, in geological terms.",
      "Has entered the final stretch. Slowly savoring it.",
      "Is closing in, one determined inch at a time.",
      "Has begun the final, glacial approach.",
    ],
    deliveredLines: [
      "Arrived. Theatrically. Exactly as yearned for.",
      "Delivered, at last, to great personal satisfaction.",
      "Made it. Already misses the journey.",
      "Arrived, and would like a moment to enjoy it.",
      "Delivered. The leaf-length journey now complete.",
    ],
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
    events: [0.08, 0.31, 0.63, 0.91],
    dispatchLines: [
      "Cleared for take-off. Chip-related delay pre-approved.",
      "Wings checked. Attention span: variable.",
      "Departed the ledge with real confidence.",
      "Beak pointed forward. Focus: temporary.",
      "Left the ledge. Chip loyalty tested.",
    ],
    midTransitLines: [
      "Has stopped to judge a statue.",
      "Is negotiating with a chip. Terms remain unclear.",
      "Joined the wrong flock for six minutes.",
      "Can see the destination but prefers a dramatic approach.",
      "Is loitering near a food truck, allegedly for research.",
      "Has taken a detour to bully a smaller pigeon.",
      "Is strutting sideways for reasons known only to it.",
      "Has landed on a wire to think about nothing.",
      "Is following a jogger for no clear reason.",
      "Has paused to inspect a suspicious sandwich.",
      "Is bickering with another pigeon over territory.",
      "Has taken the scenic route past three bakeries.",
      "Is preening mid-flight. Priorities intact.",
      "Has landed to reconsider its life choices.",
    ],
    nearArrivalLines: [
      "Coming in hot, in the loosest sense of hot.",
      "Has decided this is close enough to a runway.",
      "Is circling once for the drama of it.",
      "Nearly there. Has spotted a second chip. Ignoring it. Mostly.",
      "Is making unnecessary loops for style points.",
      "Has the destination locked in, mostly.",
    ],
    deliveredLines: [
      "Landed with street-smart swagger and one (1) crumb still stuck to it.",
      "Touched down, immediately began pacing importantly.",
      "Delivered. Looking around for applause, or crumbs.",
      "Delivered, then strutted off like it owned the place.",
      "Arrived, immediately began scanning for snacks.",
    ],
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
    events: [0.05, 0.24, 0.66, 0.89],
    dispatchLines: [
      "Saddled up. Precious cargo secured, opinions unchanged.",
      "Reins checked. Checked them right back.",
      "Set off at exactly the pace it intended to keep.",
      "Cargo double-checked. Enthusiasm not required.",
      "Set off, unhurried, as a matter of policy.",
    ],
    midTransitLines: [
      "Has stopped to admire the view. This is now a scenic pause.",
      "Has chosen a path that is technically not a path.",
      "Is clip-clopping to a distant accordion.",
      "Would like it noted that uphill builds character.",
      "Has stopped walking entirely, on principle.",
      "Is taking the long way, deliberately, for effect.",
      "Has decided this is a good spot for a think.",
      "Is plodding forward with real, quiet stubbornness.",
      "Has stopped to stare down a fence post.",
      "Is taking a break from the break it just took.",
      "Has decided the shade is a valid excuse.",
      "Is muttering, possibly about the hill.",
      "Has stopped to let the cargo \"settle.\"",
      "Is walking at a pace only it finds reasonable.",
    ],
    nearArrivalLines: [
      "Clip-clopping closer, on its own terms.",
      "Has begrudgingly accepted that arrival is imminent.",
      "Is nearly there and would like credit for it.",
      "Has picked up the pace, slightly, under protest.",
      "Close now, and making sure everyone knows it was hard.",
      "Has spotted the destination. Unimpressed, but arriving.",
    ],
    deliveredLines: [
      "Delivered the feelings intact. Character, allegedly, built.",
      "Arrived. Stood there. Considered the journey complete.",
      "Made it. Immediately requested a rest, unrelated to the trip.",
      "Arrived. Immediately found something to lean on.",
      "Delivered, then demanded recognition for the hill.",
    ],
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
    events: [0.1, 0.38, 0.73, 0.93],
    dispatchLines: [
      "Fire lit. Message rising, mysteriously, immediately.",
      "Kindling caught. Already knows where it's going.",
      "First puff released. Intent unclear, style undeniable.",
      "Smoke rising in a decisive first curl.",
      "Ignition complete. Already showing off.",
    ],
    midTransitLines: [
      "Has become briefly shaped like a teapot.",
      "Is waiting for the wind to finish changing its mind.",
      "Has been mistaken for weather.",
      "Is drifting in cursive now.",
      "Has curled into something almost readable.",
      "Is pausing mid-air, dramatically, for no technical reason.",
      "Has briefly formed a question mark. Unrelated to the message.",
      "Is thinning out, then thickening back up, on a whim.",
      "Is spiraling upward with real confidence.",
      "Has flattened out into something almost sentence-shaped.",
      "Is catching a crosswind and rolling with it.",
      "Has briefly puffed up into a very large cloud shape.",
      "Is climbing steadily, unbothered by the breeze.",
      "Has thickened, dramatically, right on cue.",
    ],
    nearArrivalLines: [
      "Visible on the horizon, dramatically.",
      "Holding its shape just long enough to be read.",
      "Is gathering itself for one last dramatic curl.",
      "Nearly arrived, still deciding on a final shape.",
      "Is sharpening into a shape that finally reads clearly.",
      "Has nearly reached full height, holding steady.",
    ],
    deliveredLines: [
      "Dispersed on arrival, having made its point beautifully.",
      "Delivered its message, then vanished with flair.",
      "Faded out mid-air, mission unmistakably accomplished.",
      "Curled once more, then let itself go.",
      "Arrived in the sky above, then simply wasn't.",
    ],
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
    events: [0.05, 0.22, 0.6, 0.9],
    dispatchLines: [
      "Bag packed, reluctantly. Job accepted, terms unclear.",
      "Collar adjusted. Enthusiasm not included.",
      "Set off. Already questioning the assignment.",
      "Whiskers twitched. Commitment: pending.",
      "Left the windowsill. This better be worth it.",
    ],
    midTransitLines: [
      "Has stopped to consider the box.",
      "Is now in the box. Delivery paused.",
      "Emerged from the box for a snack, delivery resumed.",
      "Has decided the rug is the destination.",
      "Is watching a bird instead of walking.",
      "Has flopped over in a sunbeam. Regrouping.",
      "Is stalking something that isn't there.",
      "Has stopped to groom, mid-stride, unbothered.",
      "Is chasing a leaf that started this whole detour.",
      "Has paused to judge a passing dog.",
      "Is walking along the fence instead of the ground.",
      "Has stopped to knead a suspicious patch of grass.",
      "Is ignoring the destination on principle.",
      "Has sat down to think about nothing for a while.",
    ],
    nearArrivalLines: [
      "Nearing the good chair. Delivery is a formality now.",
      "Has remembered the job. Briefly.",
      "Is almost there, walking like it was never in doubt.",
      "Nearly arrived. Has spotted a better nap spot nearby. Resisting.",
      "Close now, and acting like it planned this timing.",
      "Has spotted the destination. Choosing to saunter.",
    ],
    deliveredLines: [
      "Delivered, then immediately went to go lie down somewhere better.",
      "Arrived. Considered the job done. Considered a nap owed.",
      "Delivered, with maximum nonchalance and zero apology.",
      "Delivered, then claimed the nearest sunny spot.",
      "Arrived without comment, then demanded a treat.",
    ],
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
