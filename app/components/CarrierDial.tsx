"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CarrierSprite from "./CarrierSprite";

export type DialCarrier = {
  id: string;
  label: string;
  speed: string;
  color: string;
  sprite: string;
};

/**
 * Horizontal porthole gauge: carriers pass behind a circular window in a
 * scroll-snap strip; whichever slot is centered is the selection (no
 * separate click-to-select step). A knob on the left and left/right arrows
 * offer a non-drag way to spin it.
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
  const trackRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [centerIndex, setCenterIndex] = useState(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = useMemo(
    () => (selected ? carriers.findIndex((c) => c.id === selected) : -1),
    [carriers, selected]
  );

  // Figure out which slot is nearest the viewport center and report it.
  const detectCenter = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const trackRect = track.getBoundingClientRect();
    const mid = trackRect.left + trackRect.width / 2;
    let bestIndex = 0;
    let bestDist = Infinity;
    slotRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    });
    setCenterIndex(bestIndex);
    return bestIndex;
  }, []);

  const handleScroll = useCallback(() => {
    detectCenter();
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const idx = detectCenter();
      if (idx != null && carriers[idx]) onSelect(carriers[idx].id);
    }, 120);
  }, [detectCenter, carriers, onSelect]);

  // Initialize scroll position to the currently selected carrier (or first).
  useEffect(() => {
    const track = trackRef.current;
    const idx = selectedIndex >= 0 ? selectedIndex : 0;
    const el = slotRefs.current[idx];
    if (track && el) {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
      setCenterIndex(idx);
      if (carriers[idx] && selectedIndex < 0) onSelect(carriers[idx].id);
    }
    // Only run once on mount — subsequent selection is user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  function spin(direction: -1 | 1) {
    const nextIndex = Math.min(carriers.length - 1, Math.max(0, centerIndex + direction));
    const el = slotRefs.current[nextIndex];
    if (el) {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      setCenterIndex(nextIndex);
      onSelect(carriers[nextIndex].id);
    }
  }

  const active = carriers[centerIndex];

  return (
    <div className="carrier-dial">
      <div className="dial-knob-col">
        <div className="dial-knob" aria-hidden="true">
          <span className="dial-knob-notch" />
        </div>
        <div className="dial-knob-arrows">
          <button
            type="button"
            className="dial-arrow dial-arrow--prev"
            aria-label="Previous messenger"
            onClick={() => spin(-1)}
            disabled={centerIndex <= 0}
          >
            &#9664;
          </button>
          <button
            type="button"
            className="dial-arrow dial-arrow--next"
            aria-label="Next messenger"
            onClick={() => spin(1)}
            disabled={centerIndex >= carriers.length - 1}
          >
            &#9654;
          </button>
        </div>
      </div>

      <div className="dial-viewport">
        <div className="dial-porthole" aria-hidden="true" />
        <div
          className="dial-track"
          ref={trackRef}
          onScroll={handleScroll}
          role="listbox"
          aria-label="Choose a messenger"
        >
          <div className="dial-spacer" aria-hidden="true" />
          {carriers.map((m, i) => {
            const distance = Math.abs(i - centerIndex);
            const isActive = i === centerIndex;
            return (
              <div
                key={m.id}
                ref={(el) => {
                  slotRefs.current[i] = el;
                }}
                className={`dial-slot${isActive ? " is-active" : ""}`}
                data-distance={Math.min(distance, 3)}
                style={{ ["--card" as string]: m.color }}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  if (!isActive) {
                    slotRefs.current[i]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
                  }
                  onSelect(m.id);
                }}
              >
                <div className="dial-visual">
                  <CarrierSprite src={m.sprite} colorKey label={`${m.label} sprite`} />
                </div>
              </div>
            );
          })}
          <div className="dial-spacer" aria-hidden="true" />
        </div>
      </div>

      <div className="dial-flag">
        <div className="dial-flag-pole" aria-hidden="true" />
        <div className="dial-flag-banner">
          <strong>{active ? active.label : "Turn to choose wisely"}</strong>
          <span>{active ? active.speed : ""}</span>
        </div>
      </div>
    </div>
  );
}
