"use client";

import { useEffect, useRef } from "react";
import type { BackgroundConfig } from "@/lib/types";
import {
  drawBackground,
  tightCrop,
  computeIconPlacement,
  type CropBox,
} from "@/lib/canvasHelpers";

interface Props {
  iconBase64: string;
  config: BackgroundConfig;
}

const SIZE = 256;
const ICON_FRACTION = 0.74;

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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, SIZE, SIZE);

    drawBackground(ctx, SIZE, SIZE, config);

    const img = imgRef.current;
    const crop = cropRef.current;
    if (!img || !crop) return;

    const p = computeIconPlacement(crop, SIZE, SIZE, ICON_FRACTION);
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, p.dx, p.dy, p.dw, p.dh);
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE }}
      className="rounded-2xl shadow-lg mx-auto block"
    />
  );
}
