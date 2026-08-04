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

// Icons sit ~70% of the way from the hub to the wedge ring's outer edge.
const RADIUS_FRACTION = 0.345;
const DRAG_THRESHOLD_PX = 4;
const MOMENTUM_FACTOR = 90;
const MAX_MOMENTUM_STEPS = 1.5;
const SNAP_MS = 400;

// A hair of angular overlap between neighbouring wedges, plus a radius
// that overshoots past the wheel's own circular clip — independently
// anti-aliased adjacent `clip-path` shapes otherwise leave a hairline
// seam/gap at their shared edge and at the outer rim, even though the
// underlying angles are numerically identical and symmetric.
const SLICE_ANGLE_OVERLAP_DEG = 0.35;
const SLICE_RADIUS_OVERSHOOT = 51;

/** Builds an SVG-free circular clip-path for a true pie slice spanning [start, end) degrees, 0deg = up. */
function sliceClipPath(startDeg: number, endDeg: number) {
  const from = startDeg - SLICE_ANGLE_OVERLAP_DEG;
  const to = endDeg + SLICE_ANGLE_OVERLAP_DEG;
  const steps = Math.max(8, Math.ceil((to - from) / 2));
  const points = ["50% 50%"];
  for (let i = 0; i <= steps; i++) {
    const deg = from + ((to - from) * i) / steps;
    const rad = ((deg - 90) * Math.PI) / 180;
    const x = 50 + SLICE_RADIUS_OVERSHOOT * Math.cos(rad);
    const y = 50 + SLICE_RADIUS_OVERSHOOT * Math.sin(rad);
    points.push(`${x.toFixed(3)}% ${y.toFixed(3)}%`);
  }
  return `polygon(${points.join(", ")})`;
}

/** Wraps a degree difference into (-180, 180], so incremental drag deltas never jump across the 0/360 seam. */
function normalizeDelta(deg: number) {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/** Clock-angle (0deg = up, clockwise positive) from a wheel's center to a point. */
function angleFromCenter(cx: number, cy: number, x: number, y: number) {
  return (Math.atan2(x - cx, -(y - cy)) * 180) / Math.PI;
}

/**
 * Static decorative bezel: a layered rim plus major/minor tick marks, drawn
 * once as an SVG matching the 560x560 reference spec (outer stroke r=245,
 * mid-tone ring r=236, cream inset ring r=226, hairline ring r=219; ticks
 * radiating from r=267, major every 45deg, minor every 9deg). It's an
 * overlay, not part of the rotating wheel — scales with the wheel via the
 * viewBox rather than rotating with `spin`.
 */
function DialRim() {
  const ticks = [];
  for (let deg = 0; deg < 360; deg += 9) {
    const major = deg % 45 === 0;
    ticks.push(
      <rect
        key={deg}
        x={-1}
        y={-267}
        width={2}
        height={major ? 12 : 7}
        rx={1}
        fill="#6B5A52"
        opacity={major ? 0.72 : 0.48}
        transform={`rotate(${deg})`}
      />
    );
  }
  return (
    <svg className="wheel-rim" viewBox="0 0 560 560" aria-hidden="true">
      <g transform="translate(280 280)">{ticks}</g>
      <circle cx="280" cy="280" r="245" fill="none" stroke="#7C6C62" strokeWidth="3" />
      <circle cx="280" cy="280" r="236" fill="none" stroke="#B6A99B" strokeWidth="4" />
      <circle cx="280" cy="280" r="226" fill="none" stroke="#F8F2E8" strokeWidth="5" />
      <circle cx="280" cy="280" r="219" fill="none" stroke="#8B7B70" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

/**
 * Radial rotary wheel: carriers sit in equal 60deg pie wedges around a
 * static center hub, framed by a fixed decorative rim/tick bezel. The wheel
 * is rotated directly — by click-and-drag (with momentum + snap-to-segment
 * on release), by scroll/trackpad swipe, or by clicking a wedge to spin it
 * to the pointer. A fixed indicator at 12 o'clock marks whichever wedge is
 * selected.
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
  const [isDragging, setIsDragging] = useState(false);
  const spinRef = useRef(0);
  const ringRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(140);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastAngle: number;
    lastTime: number;
    velocity: number;
    dragging: boolean;
  } | null>(null);

  useEffect(() => {
    spinRef.current = spin;
  }, [spin]);

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

  /** Snaps a raw spin value to the nearest segment and reports the resulting wedge index. */
  function settleAt(rawSpin: number) {
    const snapped = Math.round(rawSpin / stepDeg) * stepDeg;
    const idx = (((Math.round(-snapped / stepDeg) % count) + count) % count);
    setSpin(snapped);
    setIndex(idx);
    onSelect(carriers[idx].id);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowDown" || e.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  function centerOf(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== undefined && e.button !== 0) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastAngle: 0,
      lastTime: performance.now(),
      velocity: 0,
      dragging: false,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = ringRef.current;
    if (!drag || !el) return;

    if (!drag.dragging) {
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (dist < DRAG_THRESHOLD_PX) return;
      drag.dragging = true;
      setIsDragging(true);
      const { cx, cy } = centerOf(el);
      drag.lastAngle = angleFromCenter(cx, cy, e.clientX, e.clientY);
      drag.lastTime = performance.now();
      el.setPointerCapture(e.pointerId);
    }

    const { cx, cy } = centerOf(el);
    const angle = angleFromCenter(cx, cy, e.clientX, e.clientY);
    const now = performance.now();
    const delta = normalizeDelta(angle - drag.lastAngle);
    const dt = Math.max(1, now - drag.lastTime);

    spinRef.current += delta;
    setSpin(spinRef.current);

    drag.velocity = drag.velocity * 0.7 + (delta / dt) * 0.3;
    drag.lastAngle = angle;
    drag.lastTime = now;
    e.preventDefault();
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = ringRef.current;
    if (!drag) return;
    if (drag.dragging) {
      const momentum = Math.max(
        -stepDeg * MAX_MOMENTUM_STEPS,
        Math.min(stepDeg * MAX_MOMENTUM_STEPS, drag.velocity * MOMENTUM_FACTOR)
      );
      setIsDragging(false);
      settleAt(spinRef.current + momentum);
      if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }

  const wheelAccum = useRef(0);
  const wheelCooldown = useRef(0);
  function onWheelScroll(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const now = performance.now();
    if (now < wheelCooldown.current) return;
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    wheelAccum.current += delta;
    const THRESHOLD = 40;
    if (wheelAccum.current > THRESHOLD) {
      move(1);
      wheelAccum.current = 0;
      wheelCooldown.current = now + SNAP_MS;
    } else if (wheelAccum.current < -THRESHOLD) {
      move(-1);
      wheelAccum.current = 0;
      wheelCooldown.current = now + SNAP_MS;
    }
  }

  return (
    <div className="wheel-wrap">
      <div className="wheel-pointer" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <DialRim />

      <div
        className={`wheel-ring${isDragging ? " is-dragging" : ""}`}
        ref={ringRef}
        role="listbox"
        aria-label="Choose a messenger — drag, scroll, or click a wedge to rotate"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheelScroll}
        style={{ touchAction: "none" }}
      >
        <div className={`wheel-spin${isDragging ? " is-dragging" : ""}`} style={{ transform: `rotate(${spin}deg)` }}>
          {carriers.map((m, i) => (
            <div
              key={m.id}
              className={`wheel-slice${i === index ? " is-selected" : ""}`}
              style={{ "--clip": sliceClipPath(i * stepDeg - stepDeg / 2, i * stepDeg + stepDeg / 2) } as React.CSSProperties}
            />
          ))}
        </div>

        <div className={`wheel-items${isDragging ? " is-dragging" : ""}`}>
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
          <span className="wheel-hub__mark">E</span>
        </div>
      </div>
    </div>
  );
}
