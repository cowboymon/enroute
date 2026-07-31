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
| `smoke_signal` | Smoke Signal | 30 seconds |
| `helicopter` | Helicopter | 2 minutes |
| `carrier_pigeon` | Carrier Pigeon | 15 minutes |
| `donkey` | Donkey | 30–60 minutes (rolled once, server-side) |
| `snail` | Snail | 2–4 hours (rolled once, server-side) |
| `kitty_cat` | Kitty Cat | 10 minutes – 6 hours (rolled once, server-side) |

Random-duration methods are rolled exactly once, at the moment the recipient chooses
them, and the resulting `arrivalAt` is persisted — it is never re-rolled on subsequent
visits.

## Data model

A single `Message` model (see `prisma/schema.prisma`) tracks:

- `status`: `PENDING_CHOICE` → `IN_TRANSIT` → `ARRIVED`
- `chosenMethod` / `arrivalAt`: set once the recipient picks a method
- `readAt`: set the first time the arrived message is actually viewed
- `senderNotifiedReadAt`: modeled for a future "sender gets notified when read" feature,
  not implemented here

Expired/unclaimed messages (never opened after N days) are representable in this model
via `createdAt` + the absence of `readAt`, but no background job or cleanup is
implemented in this prototype.

## Design notes

This is an early prototype — visual design and the color palette are **not final**.
Everything renders with placeholder shapes/colored blocks for delivery-method art and the
arrival "seal" animation. All colors are defined as CSS custom properties in
`app/globals.css` (`--color-bg`, `--color-surface`, `--color-accent`, etc.) so the palette
can be swapped in one place later.

## Fonts

Four local fonts are wired up via `next/font/local` (`app/fonts/index.ts`) and exposed as
CSS variables so components never reference font names directly:

- `--font-trovical` — Trovical, used only for headlines/section titles and the "Enroute"
  logotype.
- `--font-liquid-embrace` — DK Liquid Embrace, used only for the unlocked message body
  text on the reveal screen.
- `--font-advercase-bold` — Advercase Bold, used for stamps/badges/short labels.
- `--font-advercase-regular` — Advercase Regular, used for everyday UI/body text.

## Tech stack

Next.js (App Router, TypeScript), Prisma + SQLite, plain CSS with theme tokens. No auth,
no real email sending, no background jobs — intentionally out of scope for this
prototype.
