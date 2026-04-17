"use client";

import { useEffect, useRef } from "react";
import type { BackgroundConfig } from "@/lib/types";

interface Props {
  iconBase64: string;
  config: BackgroundConfig;
}

const SIZE = 256;
const ICON_FRACTION = 0.74;

const NAMED_DIRECTIONS: Record<string, number> = {
  "to-right": 0,
  "to-top-right": 45,
  "to-top": 90,
  "to-top-left": 135,
  "to-left": 180,
  "to-bottom-left": 225,
  "to-bottom": 270,
  "to-bottom-right": 315,
};

function angleToEndpoints(angleDeg: number, w: number, h: number) {
  const rad = (Math.PI / 180) * (90 - angleDeg);
  const dx = Math.cos(rad);
  const dy = -Math.sin(rad);
  const corners: [number, number][] = [[0, 0], [w, 0], [w, h], [0, h]];
  let minP = Infinity;
  let maxP = -Infinity;
  let start: [number, number] = corners[0];
  let end: [number, number] = corners[0];
  for (const c of corners) {
    const p = c[0] * dx + c[1] * dy;
    if (p < minP) { minP = p; start = c; }
    if (p > maxP) { maxP = p; end = c; }
  }
  return { x0: start[0], y0: start[1], x1: end[0], y1: end[1] };
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: BackgroundConfig,
) {
  if (config.type === "solid") {
    ctx.fillStyle = config.color ?? "#000000";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const colors = config.colors ?? ["#000000", "#ffffff"];
  const angle = NAMED_DIRECTIONS[config.direction ?? "to-bottom"] ?? 270;
  const { x0, y0, x1, y1 } = angleToEndpoints(angle, w, h);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  colors.forEach((c, i) => g.addColorStop(i / Math.max(1, colors.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

interface CropBox { x: number; y: number; w: number; h: number }

function tightCrop(img: HTMLImageElement): CropBox {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: width, h: height };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export default function BackgroundPreview({ iconBase64, config }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropRef = useRef<CropBox | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      cropRef.current = tightCrop(img);
      draw();
    };
    img.src = `data:image/png;base64,${iconBase64}`;
    return () => {
      imgRef.current = null;
      cropRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconBase64]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    drawBackground(ctx, SIZE, SIZE, config);

    const img = imgRef.current;
    const crop = cropRef.current;
    if (!img || !crop) return;

    const max = SIZE * ICON_FRACTION;
    const scale = Math.min(max / crop.w, max / crop.h);
    const dw = crop.w * scale;
    const dh = crop.h * scale;
    const dx = (SIZE - dw) / 2;
    const dy = (SIZE - dh) / 2;
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, dx, dy, dw, dh);
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE }}
      className="rounded-2xl shadow-lg mx-auto block"
    />
  );
}
