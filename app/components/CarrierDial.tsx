"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CarrierSprite from "./CarrierSprite";

export type DialCarrier = {
  id: string;
  label: string;
  speed: string;
  color: string;
  sprite: string;
};

/**
 * Vertical rotary gauge: carrier cards sit in a translateY track behind a
 * D-shaped viewport window, ringed by a rim + tick scale. A peach selection
 * band marks the centered row; the knob (with pointer) and up/down arrows
 * step through the list.
 */
export default function CarrierDial({
  carriers,
  selected,
  onSelect,
}: {
  carriers: DialCarrier[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const selectedIndex = useMemo(
    () => (selected ? carriers.findIndex((c) => c.id === selected) : -1),
    [carriers, selected]
  );
  const [index, setIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(108);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const h = parseFloat(getComputedStyle(el).getPropertyValue("--row-height"));
    if (h) setRowHeight(h);
  }, []);

  // Initialize to the currently selected carrier (or first) on mount.
  useEffect(() => {
    if (selectedIndex < 0 && carriers[0]) onSelect(carriers[0].id);
    // Only run once on mount — subsequent selection is user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function move(direction: -1 | 1) {
    const next = (index + direction + carriers.length) % carriers.length;
    setIndex(next);
    onSelect(carriers[next].id);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") move(-1);
      if (e.key === "ArrowDown") move(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, carriers]);

  return (
    <div className="dial-wrap" ref={wrapRef}>
      <div className="dial-ticks" aria-hidden="true" />

      <button
        type="button"
        className="dial-arrow dial-arrow--up"
        aria-label="Previous messenger"
        onClick={() => move(-1)}
      >
        &#9650;
      </button>

      <div className="dial" role="listbox" aria-label="Choose a messenger">
        <div className="dial-rim dial-rim--outer" aria-hidden="true" />
        <div className="dial-rim dial-rim--inner" aria-hidden="true" />

        <div className="viewport">
          <div
            className="messenger-track"
            style={{ transform: `translateY(${-index * rowHeight}px)` }}
          >
            {carriers.map((m, i) => (
              <div
                key={m.id}
                className={`messenger-card${i === index ? " is-selected" : ""}`}
                role="option"
                aria-selected={i === index}
              >
                <div className="dial-visual">
                  <CarrierSprite src={m.sprite} colorKey label={`${m.label} sprite`} />
                </div>
                <div>
                  <span className="messenger-name">{m.label}</span>
                  <span className="messenger-time">{m.speed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="selection-band" aria-hidden="true" />

        <button type="button" className="selector-knob" aria-label="Next messenger" onClick={() => move(1)}>
          <span className="selector-knob__face">&#9664;</span>
          <span className="selector-knob__pointer" aria-hidden="true" />
        </button>

        <div className="dial-scale" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="dial-arrow dial-arrow--down"
        aria-label="Next messenger"
        onClick={() => move(1)}
      >
        &#9660;
      </button>

      <div className="choice-tab" aria-hidden="true">
        <span>
          TURN
          <br />
          TO CHOOSE
          <br />
          WISELY
        </span>
        <b>&#10022;</b>
      </div>
    </div>
  );
}
