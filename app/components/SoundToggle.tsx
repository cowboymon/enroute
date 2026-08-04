"use client";

import { useEffect, useRef, useState } from "react";

const PLAYLIST_ID = "37i9dQZF1DWYoYGBbGKurt";
const EMBED_SRC = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`;

/**
 * A small lofi-playlist toggle for the topbar. Rather than hosting audio
 * ourselves, this just pops open a compact Spotify embed of a lofi
 * playlist — playback, volume, and licensing all stay Spotify's problem.
 */
export default function SoundToggle() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="sound-toggle" ref={wrapRef}>
      <button
        type="button"
        className={`sound-toggle__button${open ? " is-active" : ""}`}
        aria-label={open ? "Hide the lofi playlist" : "Play a lofi playlist while you wait"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">&#9834;</span>
      </button>
      {open && (
        <div className="sound-toggle__panel" role="dialog" aria-label="Lofi playlist">
          <iframe
            title="Lofi playlist"
            src={EMBED_SRC}
            width="100%"
            height="152"
            style={{ border: 0, borderRadius: 8 }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
