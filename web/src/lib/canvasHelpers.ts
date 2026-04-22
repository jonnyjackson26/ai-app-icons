import type { BackgroundConfig } from "@/lib/types";

export const NAMED_DIRECTIONS: Record<string, number> = {
  "to-right": 0,
  "to-top-right": 45,
  "to-top": 90,
  "to-top-left": 135,
  "to-left": 180,
  "to-bottom-left": 225,
  "to-bottom": 270,
  "to-bottom-right": 315,
};

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = `data:image/png;base64,${base64}`;
  });
}

export function angleToEndpoints(angleDeg: number, w: number, h: number) {
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

export function drawBackground(
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

export function tightCrop(img: HTMLImageElement, alphaThreshold = 10): CropBox {
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
      if (data[row + x * 4 + 3] > alphaThreshold) {
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

export interface IconPlacement {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export function computeIconPlacement(
  crop: CropBox,
  canvasW: number,
  canvasH: number,
  iconFraction: number,
): IconPlacement {
  const maxSide = Math.max(1, Math.floor(Math.min(canvasW, canvasH) * iconFraction));
  const scale = Math.min(maxSide / crop.w, maxSide / crop.h);
  const dw = Math.round(crop.w * scale);
  const dh = Math.round(crop.h * scale);
  const dx = Math.floor((canvasW - dw) / 2);
  const dy = Math.floor((canvasH - dh) / 2);
  return { dx, dy, dw, dh };
}

export function placeIconCentered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: CropBox,
  canvasW: number,
  canvasH: number,
  iconFraction: number,
): IconPlacement {
  const p = computeIconPlacement(crop, canvasW, canvasH, iconFraction);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, p.dx, p.dy, p.dw, p.dh);
  return p;
}

export function canvasToPngBase64(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL("image/png");
  return dataUrl.split(",")[1] ?? "";
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
