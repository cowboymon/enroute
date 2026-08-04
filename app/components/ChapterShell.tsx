"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STICKER_CATALOG, type Sticker } from "@/lib/stickerCatalog";
import { pickNoRepeat } from "@/lib/noRepeatPicker";
import StatsTeaser from "@/app/components/StatsTeaser";

const RECENT_STICKERS_KEY = "enroute-recent-stickers";
const MAX_RECENT_STICKERS = 6;

/** Re-rolls the two story-rail stickers, avoiding recently-shown ones (across atlases). */
function rollStickers(): { stickers: [Sticker, Sticker]; updatedRecentIds: string[] } {
  const keys = STICKER_CATALOG.map((s) => s.key);
  let recent: string[] = [];
  try {
    recent = JSON.parse(localStorage.getItem(RECENT_STICKERS_KEY) ?? "[]");
  } catch {
    recent = [];
  }

  const first = pickNoRepeat(keys, recent, MAX_RECENT_STICKERS);
  const second = pickNoRepeat(
    keys.filter((k) => k !== first.value),
    first.updatedRecentIds,
    MAX_RECENT_STICKERS
  );

  const firstSticker = STICKER_CATALOG.find((s) => s.key === first.value)!;
  const secondSticker = STICKER_CATALOG.find((s) => s.key === second.value)!;

  return { stickers: [firstSticker, secondSticker], updatedRecentIds: second.updatedRecentIds };
}

const STAGE_LABELS = [
  "Chapter 01 · The note",
  "Chapter 02 · The choice",
  "Chapter 03 · The journey",
  "Chapter 04 · The opening",
];

const JOURNEY = [
  { key: "compose", index: "01", title: "Write", note: "A note from you" },
  { key: "choose", index: "02", title: "Choose", note: "Their carrier, their wait" },
  { key: "transit", index: "03", title: "Travel", note: "Somewhere between here and there" },
  { key: "reveal", index: "04", title: "Open", note: "Worth it, hopefully" },
];

const TICKER_LINES = [
  "Every message here takes the scenic route on purpose.",
  "Fast was never the point.",
  "Delivery speed may vary. Delivery charm will not.",
  "Some messages arrive in minutes. Some arrive in their own time.",
  "Nothing here has ever been sent by drone. That's a rule, not an accident.",
  "The fastest route is rarely the one chosen.",
  "Every carrier has somewhere to be. Eventually.",
  "Patience is part of the delivery.",
  "No two deliveries have ever taken the same path twice.",
  "This is not the app for urgent news.",
];

const TICKER_TEXT = TICKER_LINES.join("  ·  ") + "  ·  ";

/**
 * Shared journey chrome — topbar, the story rail on the left, and the
 * chapter-progress strip above the active chapter's content. Ported from
 * the prototype's index.html shell + the `updateChrome()` logic in app.js.
 */
export default function ChapterShell({
  stageIndex,
  status,
  railDispatch,
  children,
  fullBleed = false,
}: {
  /** 0 = compose/handoff, 1 = choose, 2 = transit, 3 = reveal */
  stageIndex: number;
  status: string;
  railDispatch: string;
  children: React.ReactNode;
  /** Drops the story rail entirely so the workspace (e.g. the transit scene) spans full width. */
  fullBleed?: boolean;
}) {
  const clampedIndex = Math.max(0, Math.min(3, stageIndex));

  // Re-roll which two stickers appear in the postal-cluster on each page
  // load (compose, choose/transit/reveal all mount this shell fresh),
  // avoiding recent repeats via localStorage.
  const [stickers, setStickers] = useState<[Sticker, Sticker]>([
    STICKER_CATALOG.find((s) => s.key === "journey")!,
    STICKER_CATALOG.find((s) => s.key === "slow")!,
  ]);
  useEffect(() => {
    const { stickers: rolled, updatedRecentIds } = rollStickers();
    setStickers(rolled);
    try {
      localStorage.setItem(RECENT_STICKERS_KEY, JSON.stringify(updatedRecentIds));
    } catch {
      // localStorage unavailable — stickers just won't persist rotation history.
    }
  }, []);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="wordmark" aria-label="Restart Enroute">
          Enroute
        </Link>
        <div className="topbar__right">
          <span className="status-dot" aria-hidden="true" />
          <span>{status}</span>
        </div>
      </header>

      <main className={`shell${fullBleed ? " shell--full-bleed" : ""}`}>
        {!fullBleed && (
          <aside className="story-rail">
            <div className="eyebrow">A slower messaging experiment</div>
            <h1>
              Send a little
              <br />
              <em>anticipation.</em>
            </h1>
            <p className="lede">
              Write something now. Let them choose how it finds its way. The waiting is
              part of the message.
            </p>
            <div className="postal-cluster" aria-hidden="true">
              <i className={`postal-stamp ${stickers[0].atlas} ${stickers[0].badgeClass} sticker-slot-1`} />
              <i className={`postal-stamp ${stickers[1].atlas} ${stickers[1].badgeClass} sticker-slot-2`} />
            </div>

            <ol className="journey" aria-label="Message journey">
              {JOURNEY.map((item, i) => (
                <li
                  key={item.key}
                  className={
                    i === clampedIndex ? "is-active" : i < clampedIndex ? "is-past" : undefined
                  }
                >
                  <span>{item.index}</span>
                  <div>
                    <b>{item.title}</b>
                    <small>{item.note}</small>
                  </div>
                </li>
              ))}
            </ol>

            <div className="rail-note">
              <span>Current dispatch</span>
              <strong>{railDispatch}</strong>
              <StatsTeaser />
            </div>
          </aside>
        )}

        <section className="workspace" aria-live="polite">
          <div className="workspace__chrome">
            <span>{STAGE_LABELS[clampedIndex]}</span>
            <div className="chapter-dots" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} className={i === clampedIndex ? "is-active" : undefined} />
              ))}
            </div>
          </div>
          <div className="workspace__body">{children}</div>
        </section>
      </main>

      <footer className="ticker" aria-hidden="true">
        <div>{TICKER_TEXT}</div>
        <div>{TICKER_TEXT}</div>
      </footer>
    </>
  );
}
