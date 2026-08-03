"use client";

import { useEffect, useRef } from "react";

/**
 * Draws a carrier sprite onto a canvas, matching the prototype's
 * `drawSprite` technique: source art is a (possibly multi-frame) sprite
 * sheet drawn at a fixed 724x724 canvas size with nearest-neighbour
 * scaling, with an optional magenta color-key pass that turns
 * near-magenta pixels transparent for sprite sheets that use it instead of
 * real alpha. The carrier art in /public/characters uses magenta color-key
 * backgrounds, so callers pass `colorKey`.
 */
export default function CarrierSprite({
  src,
  frame = 0,
  colorKey = false,
  label,
  className,
}: {
  src: string;
  frame?: number;
  colorKey?: boolean;
  label: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const frames = image.width / image.height > 2 ? 3 : 1;
      const safeFrame = frames === 1 ? 0 : frame;
      const frameWidth = image.width / frames;
      const size = 724;
      canvas.width = size;
      canvas.height = size;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(image, frameWidth * safeFrame, 0, frameWidth, image.height, 0, 0, size, size);
      if (colorKey) {
        const pixels = ctx.getImageData(0, 0, size, size);
        const data = pixels.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 210 && b > 190 && g < 80) data[i + 3] = 0;
        }
        ctx.putImageData(pixels, 0, 0);
      }
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, frame, colorKey]);

  return (
    <canvas
      ref={canvasRef}
      width={724}
      height={724}
      role="img"
      aria-label={label}
      className={className}
    />
  );
}
