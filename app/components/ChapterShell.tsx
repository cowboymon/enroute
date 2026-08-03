"use client";

import Link from "next/link";

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

const TICKER_TEXT =
  "WOMBAT POST · BLIMP EXPRESS · SNAIL MAIL · PIGEON AIR · DONKEY DISPATCH · SMOKE SIGNAL · ";

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
}: {
  /** 0 = compose/handoff, 1 = choose, 2 = transit, 3 = reveal */
  stageIndex: number;
  status: string;
  railDispatch: string;
  children: React.ReactNode;
}) {
  const clampedIndex = Math.max(0, Math.min(3, stageIndex));

  return (
    <>
      <header className="topbar">
        <Link href="/" className="wordmark" aria-label="Restart Enroute">
          <span className="mark">E</span>
          <span>Enroute</span>
        </Link>
        <div className="topbar__right">
          <span className="status-dot" aria-hidden="true" />
          <span>{status}</span>
        </div>
      </header>

      <main className="shell">
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
            <i className="postal-stamp atlas-two badge-journey" />
            <i className="postal-stamp atlas-two badge-slow" />
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
          </div>
        </aside>

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
