# Enroute

Enroute is a messaging prototype where the **recipient**, not the sender, chooses how a
message is delivered — and that choice determines a real, server-tracked delivery
duration before the message unlocks.

The sender writes a message and gets a shareable link (`/m/[id]`) to send the recipient
themselves — Enroute never emails it on the sender's behalf. The recipient opens the
link, picks a delivery method with no preview of the content, and watches a
server-computed countdown until the message "arrives" and unlocks. The recipient can
optionally opt in, once they're on the transit screen, to get a real email (via Resend)
the moment it arrives — see [Arrival notifications](#arrival-notifications-email-via-resend)
below.

## Running it

Enroute uses Postgres (developed against [Neon](https://neon.tech)) via Prisma. Create a
`.env` with a `DATABASE_URL` pointing at your database:

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

Then:

```bash
npm install
npx prisma db push
npm run dev
```

Then open http://localhost:3000.

`npm install` also runs `prisma generate` via `postinstall`. `npx prisma db push` syncs
the database at `DATABASE_URL` with `prisma/schema.prisma`.

## Delivery methods

| Method | Label | Duration |
| --- | --- | --- |
| `wombat` | Wombat | 20 min–12 hrs (weighted: mostly short, occasionally an epic; rolled once, server-side) |
| `blimp` | Blimp | 2–5 hours (rolled once, server-side) |
| `snail` | Snail | 8–24 hours (rolled once, server-side) |
| `pigeon` | Pigeon | 30–90 minutes (rolled once, server-side) |
| `donkey` | Donkey | 4–8 hours (rolled once, server-side) |
| `smoke` | Smoke signal | 5–20 minutes (rolled once, server-side) |
| `cat` | Kitty Cat | 10 min–6 hrs (rolled once, server-side) |

All seven methods roll a random duration (see `rollDurationSeconds` in `lib/deliveryMethods.ts`)
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
- `recipientContactType` / `recipientContact`: who the message is FOR, captured as an
  email address by the sender at compose time — the only contact info the compose form
  asks for. It's used solely so the sender can copy/share the link; Enroute never sends
  it automatically.
- `senderContactType` / `senderContact`: unused by the current compose form (the sender
  isn't asked for their own email anymore — they get their tracking link,
  `/m/[id]?as=sender`, for free, no email required). Left nullable in the schema for any
  older rows and in case a future feature wants it back.
- `notifyOnArrival` / `notifyContactType` / `notifyContact` / `notifiedAt`: the
  **recipient's** consent, asked on the transit screen (after they've already picked a
  carrier and dispatched — never before), to be pinged when the message arrives.
  `notifyContact` intentionally starts blank rather than defaulting to
  `recipientContact` — the person actually viewing the transit screen may not want to
  reuse whatever contact the sender guessed at compose time.
- `senderNotifiedReadAt`: modeled for a future "sender gets notified when read" feature,
  not implemented here

### Sender-side tracking link

There was no existing sender-status page in this prototype, so rather than build a
separate dashboard, the same `/m/[id]` view is reused for both sides: the sender's
handoff screen now also surfaces `/m/[id]?as=sender`. The `?as=sender` query param
gates the one recipient-only action (picking a delivery method) — a sender opening
their own link sees a "waiting on them to pick a messenger" placeholder instead of the
carrier picker while the message is `PENDING_CHOICE`, but otherwise watches the same
transit/reveal chapters. This is a simple query-param check, not real auth — consistent
with the rest of this app having no auth.

### Arrival notifications (email via Resend)

Contact fields (sender, recipient, and the transit-screen notify-on-arrival consent)
are **email only** for now — there's no SMS provider wired up, so the UI doesn't offer
a mobile option. If a recipient opts in on the transit screen, the app calls
`sendArrivalNotification` (see `lib/email.ts`, using the [Resend](https://resend.com)
npm package) the first time the message is observed as `ARRIVED` and `notifiedAt` is
still unset — this check lives in the `GET /api/messages/[id]` handler, alongside the
existing `effectiveStatus` computation. `notifiedAt` is then stamped so it only fires
once.

`RESEND_API_KEY` is an **optional** env var. If it isn't set, `sendArrivalNotification`
is a no-op (it logs and returns) rather than throwing, so the app still runs and builds
without a real Resend key configured. An optional `RESEND_FROM_EMAIL` overrides the
default `from` address (`Enroute <onboarding@resend.dev>`).

To turn real arrival emails on: grab an API key from the
[Resend dashboard](https://resend.com/api-keys) and set `RESEND_API_KEY` (locally in
`.env.local`, or as an env var on whatever host runs the app). Without a verified
sending domain, Resend's shared `resend.dev` address only delivers to the email on your
own Resend account — verify a domain and set `RESEND_FROM_EMAIL` once you want to send
to arbitrary recipients.

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

The seven delivery methods are now real illustrated carriers (wombat, blimp, snail, pigeon,
donkey, smoke signal, kitty cat) instead of placeholder emoji/colored blocks:

- Each carrier's card and its travelling marker draw from a real 3-frame sprite sheet
  (`public/characters/*.png`, magenta color-keyed) onto a `<canvas>` via
  `app/components/CarrierSprite.tsx`. The travelling marker briefly swaps to the third
  frame whenever a field-note "oddity" fires, for a beat of extra motion.
- The transit chapter's traveller is animated along a hand-authored path
  (`lib/journeyPaths.ts`) — purely a visual shape, interpolated by the real elapsed-time
  percentage computed from the server's `arrivalAt`, never by a client-side timer of its
  own.
- Field notes ("oddities") and progress-stage captions rotate in based on how far along
  the real countdown is (see the `events`/`progress`/`oddities` fields on each
  `DeliveryMethod` in `lib/deliveryMethods.ts`).
- The reveal chapter's delivery stamp is drawn from a sprite atlas
  (`public/stamps/delivered-badges.png`); most carriers have their own badge, though the
  kitty cat currently reuses the generic badge (no dedicated stamp art yet).

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

Next.js (App Router, TypeScript), Prisma + Postgres (Neon), plain CSS with theme tokens,
[Resend](https://resend.com) for arrival emails. No auth, no SMS sending, no background
jobs — intentionally out of scope for this prototype.
