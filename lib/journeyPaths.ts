/**
 * Purely visual path shapes for the transit-chapter traveller animation —
 * NOT delivery timing. Each carrier has a handful of [x%, y%, scale, rotateDeg]
 * waypoints; the traveller is placed by interpolating between the two
 * waypoints nearest the current elapsed-time percentage (0-1), which is
 * itself derived from the server-authoritative arrivalAt. Ported verbatim
 * from the design prototype's app.js.
 */
export type Waypoint = [x: number, y: number, scale: number, rotate: number];

export const JOURNEY_PATHS: Record<string, Waypoint[]> = {
  wombat: [
    [7, 72, 0.82, -2],
    [25, 66, 0.94, 1],
    [20, 76, 0.88, -4],
    [48, 69, 1.04, 2],
    [66, 57, 0.84, -1],
    [88, 70, 0.96, 1],
  ],
  blimp: [
    [7, 43, 0.76, -2],
    [25, 27, 0.9, 2],
    [43, 39, 0.84, -3],
    [61, 22, 1, 2],
    [77, 35, 0.92, -1],
    [90, 28, 0.8, 1],
  ],
  snail: [
    [6, 74, 0.72, 0],
    [20, 67, 0.82, -1],
    [37, 74, 0.98, 1],
    [51, 60, 0.78, -2],
    [68, 69, 1.02, 1],
    [88, 64, 0.9, 0],
  ],
  pigeon: [
    [7, 42, 0.74, -4],
    [27, 26, 0.86, 3],
    [47, 47, 1.02, 0],
    [45, 47, 1.02, -2],
    [69, 28, 0.88, 4],
    [90, 36, 0.78, -1],
  ],
  donkey: [
    [7, 72, 0.82, 0],
    [24, 64, 0.92, -1],
    [37, 72, 1.02, 1],
    [55, 58, 0.84, -2],
    [72, 65, 0.96, 1],
    [89, 57, 0.86, 0],
  ],
  smoke: [
    [8, 73, 0.7, -3],
    [24, 57, 0.8, 2],
    [42, 38, 0.9, -2],
    [61, 27, 1, 3],
    [77, 40, 0.84, -3],
    [90, 21, 0.72, 1],
  ],
  cat: [
    [7, 70, 0.86, -2],
    [23, 75, 0.96, 2],
    [38, 62, 0.9, -3],
    [56, 71, 1.06, 1],
    [73, 60, 0.88, -1],
    [88, 68, 0.98, 1],
  ],
};

export const CARRIER_SIZES: Record<string, number> = {
  wombat: 210,
  blimp: 260,
  snail: 190,
  pigeon: 190,
  donkey: 230,
  smoke: 175,
  cat: 200,
};

export function journeyPosition(key: string, pct: number): Waypoint {
  const path = JOURNEY_PATHS[key];
  if (!path) return [50, 50, 1, 0];
  const clamped = Math.max(0, Math.min(1, pct));
  const scaled = clamped * (path.length - 1);
  const index = Math.min(path.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = path[index];
  const b = path[index + 1];
  return [
    a[0] + (b[0] - a[0]) * mix,
    a[1] + (b[1] - a[1]) * mix,
    a[2] + (b[2] - a[2]) * mix,
    a[3] + (b[3] - a[3]) * mix,
  ];
}
