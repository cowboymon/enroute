/**
 * Catalog of decorative stickers available for the story-rail's
 * `.postal-cluster` (two slots). Each entry names an atlas (`atlas-one` /
 * `atlas-two` / `atlas-three`, see app/globals.css) and a badge class
 * defined on that atlas. Rotated via lib/noRepeatPicker + localStorage —
 * see app/components/ChapterShell.tsx.
 */
export type StickerAtlas = "atlas-one" | "atlas-two" | "atlas-three";

export type Sticker = { key: string; atlas: StickerAtlas; badgeClass: string };

export const STICKER_CATALOG: Sticker[] = [
  // atlas-one (field-notes.png)
  { key: "review", atlas: "atlas-one", badgeClass: "badge-review" },
  { key: "smalltalk", atlas: "atlas-one", badgeClass: "badge-smalltalk" },
  { key: "longway", atlas: "atlas-one", badgeClass: "badge-longway" },
  { key: "costly", atlas: "atlas-one", badgeClass: "badge-costly" },
  { key: "donotrush", atlas: "atlas-one", badgeClass: "badge-donotrush" },
  { key: "worththewait", atlas: "atlas-one", badgeClass: "badge-worththewait" },
  // atlas-two (postal-badges.png)
  { key: "journey", atlas: "atlas-two", badgeClass: "badge-journey" },
  { key: "slow", atlas: "atlas-two", badgeClass: "badge-slow" },
  { key: "scenic", atlas: "atlas-two", badgeClass: "badge-scenic" },
  { key: "detour", atlas: "atlas-two", badgeClass: "badge-detour" },
  { key: "feelings", atlas: "atlas-two", badgeClass: "badge-feelings" },
  { key: "reststop", atlas: "atlas-two", badgeClass: "badge-reststop" },
  // atlas-three (delivered-badges.png)
  { key: "delivered-generic", atlas: "atlas-three", badgeClass: "delivered-generic" },
  { key: "delivered-pigeon", atlas: "atlas-three", badgeClass: "delivered-pigeon" },
  { key: "delivered-snail", atlas: "atlas-three", badgeClass: "delivered-snail" },
  { key: "delivered-donkey", atlas: "atlas-three", badgeClass: "delivered-donkey" },
  { key: "delivered-message", atlas: "atlas-three", badgeClass: "delivered-message" },
  { key: "delivered-special", atlas: "atlas-three", badgeClass: "delivered-special" },
];

export function getSticker(key: string): Sticker | undefined {
  return STICKER_CATALOG.find((s) => s.key === key);
}
