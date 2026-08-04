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

const RADIUS_FRACTION = 0.32;

/** Builds an SVG-free circular clip-path for a pie slice spanning [start, end) degrees, 0deg = up. */
function sliceClipPath(startDeg: number, endDeg: number) {
  const steps = Math.max(2, Math.ceil((endDeg - startDeg) / 4));
  const points = ["50% 50%"];
  for (let i = 0; i <= steps; i++) {
    const deg = startDeg + ((endDeg - startDeg) * i) / steps;
    const rad = ((deg - 90) * Math.PI) / 180;
    const x = 50 + 50 * Math.cos(rad);
    const y = 50 + 50 * Math.sin(rad);
    points.push(`${x}% ${y}%`);
  }
  return `polygon(${points.join(", ")})`;
}

/**
 * Radial rotary wheel: carriers sit in equal pie wedges around a static
 * center hub. Up/down arrows (or the hub itself) spin the wheel so the
 * chosen carrier's wedge settles at the top, highlighted against the rest.
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
  const count = carriers.length;
  const stepDeg = 360 / Math.max(1, count);

  const selectedIndex = useMemo(
    () => (selected ? carriers.findIndex((c) => c.id === selected) : -1),
    [carriers, selected]
  );
  const [index, setIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
  const [spin, setSpin] = useState(0);
  const ringRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(180);

  useEffect(() => {
    const el = ringRef.current;
    if (!el) return;
    const update = () => setRadius(el.getBoundingClientRect().width * RADIUS_FRACTION);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (selectedIndex < 0 && carriers[0]) onSelect(carriers[0].id);
    // Only run once on mount — subsequent selection is user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function move(direction: -1 | 1) {
    const next = (index + direction + count) % count;
    setIndex(next);
    setSpin((s) => s - direction * stepDeg);
    onSelect(carriers[next].id);
  }

  function moveTo(target: number) {
    if (target === index) return;
    let delta = target - index;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    setIndex(target);
    setSpin((s) => s - delta * stepDeg);
    onSelect(carriers[target].id);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") move(-1);
      if (e.key === "ArrowDown") move(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  return (
    <div className="wheel-wrap">
      <button type="button" className="wheel-arrow wheel-arrow--up" aria-label="Previous messenger" onClick={() => move(-1)}>
        &#9650;
      </button>

      <div className="wheel-ring" ref={ringRef} role="listbox" aria-label="Choose a messenger">
        <div className="wheel-spin" style={{ transform: `rotate(${spin}deg)` }}>
          {carriers.map((m, i) => (
            <div
              key={m.id}
              className={`wheel-slice${i === index ? " is-selected" : ""}`}
              style={
                {
                  "--clip": sliceClipPath(i * stepDeg - stepDeg / 2, i * stepDeg + stepDeg / 2),
                  "--fill": m.color,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="wheel-items">
          {carriers.map((m, i) => {
            const angle = i * stepDeg + spin;
            return (
              <div
                key={m.id}
                className={`wheel-item${i === index ? " is-selected" : ""}`}
                style={{ transform: `rotate(${angle}deg) translateY(-${radius}px)` }}
                role="option"
                aria-selected={i === index}
                onClick={() => moveTo(i)}
              >
                <div className="wheel-item-content" style={{ transform: `rotate(${-angle}deg)` }}>
                  <div className="wheel-visual">
                    <CarrierSprite src={m.sprite} colorKey label={`${m.label} sprite`} />
                  </div>
                  <strong className="wheel-name">{m.label}</strong>
                  <span className="wheel-time">{m.speed}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="wheel-hub" aria-hidden="true">
          <span className="mark">E</span>
        </div>
      </div>

      <button type="button" className="wheel-arrow wheel-arrow--down" aria-label="Next messenger" onClick={() => move(1)}>
        &#9660;
      </button>
    </div>
  );
}
