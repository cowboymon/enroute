# Enroute

Enroute is a messaging prototype where the **recipient**, not the sender, chooses how a
message is delivered — and that choice determines a real, server-tracked delivery
duration before the message unlocks.

The sender writes a message and gets a shareable link (`/m/[id]`) standing in for a real
email notification (not implemented in this prototype). The recipient opens the link,
picks a delivery method with no preview of the content, and watches a server-computed
countdown until the message "arrives" and unlocks.

## Running it

```bash
npm install
npx prisma db push
npm run dev
```

Then open http://localhost:3000.

`npm install` also runs `prisma generate` via `postinstall`. `npx prisma db push` creates
`prisma/dev.db` (a local SQLite file, gitignored) from `prisma/schema.prisma`.

## Delivery methods

| Method | Label | Duration |
| --- | --- | --- |
| `wombat` | Wombat | 20 min–12 hrs (weighted: mostly short, occasionally an epic; rolled once, server-side) |
| `blimp` | Blimp | 2–5 hours (rolled once, server-side) |
| `snail` | Snail | 8–24 hours (rolled once, server-side) |
| `pigeon` | Pigeon | 30–90 minutes (rolled once, server-side) |
| `donkey` | Donkey | 4–8 hours (rolled once, server-side) |
| `smoke` | Smoke signal | 5–20 minutes (rolled once, server-side) |

All six methods roll a random duration (see `rollDurationSeconds` in `lib/deliveryMethods.ts`)
exactly once, at the moment the recipient chooses them — the resulting `arrivalAt` is
persisted and never re-rolled on subsequent visits. The wombat is the one special case: it
rolls from three weighted duration buckets (mostly a short hop, sometimes a multi-hour
epic) rather than one flat range, but the "roll once, persist `arrivalAt`" rule is
identical for every method.

## Data model

A single `Message` model (see `prisma/schema.prisma`) tracks:

- `senderName` / `recipientName`: display names captured at compose time, used by the
  "handoff" and "reveal" chapters (e.g. "Carried by the wombat", "A note from Mon")
- `status`: `PENDING_CHOICE` → `IN_TRANSIT` → `ARRIVED`
- `chosenMethod` / `arrivalAt`: set once the recipient picks a method
- `readAt`: set the first time the arrived message is actually viewed
- `recipientEmail`: unused by the current UI (which shares a `/m/[id]` link directly
  instead of sending real email); kept optional for a future real-delivery notification
  feature
- `senderNotifiedReadAt`: modeled for a future "sender gets notified when read" feature,
  not implemented here

Expired/unclaimed messages (never opened after N days) are representable in this model
via `createdAt` + the absence of `readAt`, but no background job or cleanup is
implemented in this prototype.

## Design notes

Enroute's UI is a four-chapter "journey": **write** (compose + handoff), **choose** (pick
a carrier), **travel** (transit scene with a live countdown), and **open** (reveal). All
four share a common shell (`app/components/ChapterShell.tsx`) — a topbar, a left-hand
"story rail" with the journey outline, and a chapter-progress strip — styled as a
risograph-y, hand-stamped paper-and-ink look (thick borders, hard drop shadows, oklch
paper/ink/postbox/moss/plum tokens).

The six delivery methods are now real illustrated carriers (wombat, blimp, snail, pigeon,
donkey, smoke signal) instead of placeholder emoji/colored blocks:

- Each carrier's card and its travelling marker draw from a real sprite
  (`public/characters/*.png`) onto a `<canvas>` via `app/components/CarrierSprite.tsx`,
  which also supports an optional magenta color-key transparency pass (unused by the
  current art, but kept for sprite sheets that need it).
- The transit chapter's traveller is animated along a hand-authored path
  (`lib/journeyPaths.ts`) — purely a visual shape, interpolated by the real elapsed-time
  percentage computed from the server's `arrivalAt`, never by a client-side timer of its
  own.
- Field notes ("oddities") and progress-stage captions rotate in based on how far along
  the real countdown is (see the `events`/`progress`/`oddities` fields on each
  `DeliveryMethod` in `lib/deliveryMethods.ts`).
- The reveal chapter's delivery stamp is drawn from a sprite atlas
  (`public/stamps/delivered-badges.png`), one badge per carrier.

All colors are defined as CSS custom properties in `app/globals.css` (`--ink`, `--paper`,
`--postbox`, `--moss`, `--plum`, etc.) so the palette can be swapped in one place; a dark-mode
override block adjusts the paper/ink tokens for `prefers-color-scheme: dark`.

**Deferred / simplified vs. the design prototype**, in the interest of keeping the
server-authoritative timing model correct over pixel-perfect fidelity:

- The prototype's `oddity`/`postal` sprite badges (per-event decorative stamps in the
  story rail and field notes) were dropped in favor of the field-note text alone — only
  the six carrier-specific *delivered* badges are wired up.
- The prototype's `support.js`/`image-slot.js`/`ios-frame.jsx`/`*.dc.html` files are
  design-tool scaffolding (an internal component runtime + an earlier "Longhand" iOS-frame
  iteration of this same concept), not part of the final visual design — they were read
  for context but nothing from them was ported.
- The prototype's client-only `localStorage` state machine (`app.js`) was intentionally
  **not** ported architecturally — this app keeps the Prisma-backed `status`/`arrivalAt`
  as the single source of truth; the prototype was used only as a reference for visuals,
  timing feel, and copy.

## Fonts

The new design only calls for one custom display face — **Comico**, used for the
wordmark, chapter headlines, and carrier names — plus system serif (Georgia) for body
copy and `ui-monospace` for labels/kickers, so no other font files are needed for the
current UI:

- `--font-comico` — Comico, wired via `next/font/local` (`app/fonts/index.ts`), used for
  the "Enroute" wordmark mark and all chapter/carrier headlines.
- `--font-body` — Georgia/serif, used for body copy, the message textarea, and the
  revealed message quote.
- `--font-label` — `ui-monospace`, used for kickers, labels, and stamps.

Trovical, DK Liquid Embrace, and Advercase (the previous placeholder-era fonts) are still
wired up in `app/fonts/index.ts` and their files remain in `public/fonts/` in case a
future pass wants them for a flourish, but no current page references them.

## Tech stack

Next.js (App Router, TypeScript), Prisma + SQLite, plain CSS with theme tokens. No auth,
no real email sending, no background jobs — intentionally out of scope for this
prototype.
