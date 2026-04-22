import type { AssetFile, BackgroundConfig } from "@/lib/types";
import {
  canvasToPngBase64,
  computeIconPlacement,
  drawBackground,
  loadImage,
  makeCanvas,
  tightCrop,
  type CropBox,
} from "@/lib/canvasHelpers";

// Keep in sync with api/src/ai_app_icons/constants.py (IOS_DARK_BG).
const IOS_DARK_BG = "#262427";

interface AssetSpec {
  name: string;
  size: [number, number];
  iconFraction: number;
  hasBackground: boolean;
  variant: AssetFile["variant"];
  platform: AssetFile["platform"];
}

// Mirrors ASSETS in api/src/ai_app_icons/assets.py.
export const ASSET_SPECS: AssetSpec[] = [
  { name: "icon.png", size: [1024, 1024], iconFraction: 0.74, hasBackground: true, variant: "standard", platform: "general" },
  { name: "icon-ios.png", size: [1024, 1024], iconFraction: 0.74, hasBackground: true, variant: "standard", platform: "ios" },
  { name: "icon-ios-dark.png", size: [1024, 1024], iconFraction: 0.74, hasBackground: true, variant: "dark", platform: "ios" },
  { name: "icon-ios-tinted.png", size: [1024, 1024], iconFraction: 0.74, hasBackground: true, variant: "tinted", platform: "ios" },
  { name: "adaptive-foreground.png", size: [1024, 1024], iconFraction: 0.60, hasBackground: false, variant: "standard", platform: "android" },
  { name: "adaptive-background.png", size: [1024, 1024], iconFraction: 1.0, hasBackground: true, variant: "background", platform: "android" },
  { name: "adaptive-monochrome.png", size: [1024, 1024], iconFraction: 0.60, hasBackground: false, variant: "monochrome", platform: "android" },
  { name: "splash.png", size: [1284, 2778], iconFraction: 0.33, hasBackground: true, variant: "standard", platform: "general" },
  { name: "splash-icon.png", size: [1024, 1024], iconFraction: 0.70, hasBackground: false, variant: "standard", platform: "general" },
  { name: "favicon.png", size: [48, 48], iconFraction: 0.84, hasBackground: false, variant: "standard", platform: "web" },
];

export function resolveBgColor(cfg: BackgroundConfig): string {
  if (cfg.type === "solid") return cfg.color ?? "#ffffff";
  if (cfg.type === "gradient") return cfg.colors?.[0] ?? "#ffffff";
  return "#ffffff";
}

export function buildExpoConfig(bgColor: string): Record<string, unknown> {
  return {
    expo: {
      icon: "./assets/icon.png",
      ios: {
        icon: {
          light: "./assets/icon-ios.png",
          dark: "./assets/icon-ios-dark.png",
          tinted: "./assets/icon-ios-tinted.png",
        },
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-foreground.png",
          backgroundImage: "./assets/adaptive-background.png",
          backgroundColor: bgColor,
          monochromeImage: "./assets/adaptive-monochrome.png",
        },
      },
      web: {
        favicon: "./assets/favicon.png",
      },
    },
  };
}

function ctxOf(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  return ctx;
}

function makeIconAlphaMask(
  img: HTMLImageElement,
  crop: CropBox,
  w: number,
  h: number,
  iconFraction: number,
): HTMLCanvasElement {
  const mask = makeCanvas(w, h);
  const ctx = ctxOf(mask);
  const p = computeIconPlacement(crop, w, h, iconFraction);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, p.dx, p.dy, p.dw, p.dh);
  return mask;
}

function buildBackgroundCanvas(
  w: number,
  h: number,
  bg: BackgroundConfig,
): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  drawBackground(ctxOf(canvas), w, h, bg);
  return canvas;
}

function desaturateInPlace(canvas: HTMLCanvasElement) {
  const ctx = ctxOf(canvas);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
    d[i] = gray;
    d[i + 1] = gray;
    d[i + 2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);
}

function makeStandard(
  w: number,
  h: number,
  bg: BackgroundConfig,
  hasBackground: boolean,
  img: HTMLImageElement,
  crop: CropBox,
  iconFraction: number,
): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  const ctx = ctxOf(canvas);
  if (hasBackground) drawBackground(ctx, w, h, bg);
  const p = computeIconPlacement(crop, w, h, iconFraction);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, p.dx, p.dy, p.dw, p.dh);
  return canvas;
}

function makeBackgroundOnly(
  w: number,
  h: number,
  bg: BackgroundConfig,
): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  drawBackground(ctxOf(canvas), w, h, bg);
  return canvas;
}

function makeMonochrome(
  w: number,
  h: number,
  img: HTMLImageElement,
  crop: CropBox,
  iconFraction: number,
): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  const ctx = ctxOf(canvas);
  const p = computeIconPlacement(crop, w, h, iconFraction);

  // Draw icon alpha, then fill white under it using source-in.
  const silhouette = makeCanvas(p.dw, p.dh);
  const sctx = ctxOf(silhouette);
  sctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, p.dw, p.dh);
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = "#ffffff";
  sctx.fillRect(0, 0, p.dw, p.dh);

  ctx.drawImage(silhouette, p.dx, p.dy);
  return canvas;
}

// Mirror of is_single_color in api/src/ai_app_icons/assets.py: samples
// opaque pixels, ignores low-saturation ones, and returns true only if
// the saturated hues all fit within a 40° arc on the color wheel.
export function isSingleColor(
  img: HTMLImageElement,
  crop: CropBox,
  hueArcDeg = 40,
  satMin = 0.2,
  alphaMin = 64,
): boolean {
  const sample = makeCanvas(96, 96);
  const ctx = ctxOf(sample);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, 96, 96);
  const data = ctx.getImageData(0, 0, 96, 96).data;

  const hues: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < alphaMin) continue;
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    if (mx === 0) continue;
    const sat = (mx - mn) / mx;
    if (sat < satMin) continue;
    const delta = mx - mn;
    let hue: number;
    if (mx === r) hue = ((g - b) / delta) % 6;
    else if (mx === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
    hues.push(hue);
  }

  if (hues.length < 10) return true;

  hues.sort((a, b) => a - b);
  const n = hues.length;
  let minSpan = 360;
  for (let i = 0; i < n; i++) {
    const end = i + n - 1;
    const endVal = end < n ? hues[end] : hues[end - n] + 360;
    const span = endVal - hues[i];
    if (span < minSpan) minSpan = span;
  }
  return minSpan <= hueArcDeg;
}

function grayscaleLogoCanvas(
  img: HTMLImageElement,
  crop: CropBox,
  dw: number,
  dh: number,
): HTMLCanvasElement {
  const canvas = makeCanvas(dw, dh);
  const ctx = ctxOf(canvas);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, dw, dh);
  const imgData = ctx.getImageData(0, 0, dw, dh);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
    d[i] = gray;
    d[i + 1] = gray;
    d[i + 2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function makeIosDark(
  w: number,
  h: number,
  bg: BackgroundConfig,
  img: HTMLImageElement,
  crop: CropBox,
  iconFraction: number,
  useBackground: boolean,
): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  const ctx = ctxOf(canvas);
  ctx.fillStyle = IOS_DARK_BG;
  ctx.fillRect(0, 0, w, h);

  if (!useBackground) {
    const p = computeIconPlacement(crop, w, h, iconFraction);
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, p.dx, p.dy, p.dw, p.dh);
    return canvas;
  }

  const userBg = buildBackgroundCanvas(w, h, bg);
  const mask = makeIconAlphaMask(img, crop, w, h, iconFraction);

  const masked = makeCanvas(w, h);
  const mctx = ctxOf(masked);
  mctx.drawImage(userBg, 0, 0);
  mctx.globalCompositeOperation = "destination-in";
  mctx.drawImage(mask, 0, 0);

  ctx.drawImage(masked, 0, 0);
  return canvas;
}

function makeIosTinted(
  w: number,
  h: number,
  bg: BackgroundConfig,
  img: HTMLImageElement,
  crop: CropBox,
  iconFraction: number,
  useBackground: boolean,
): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  const ctx = ctxOf(canvas);
  ctx.fillStyle = IOS_DARK_BG;
  ctx.fillRect(0, 0, w, h);

  if (!useBackground) {
    const p = computeIconPlacement(crop, w, h, iconFraction);
    const gray = grayscaleLogoCanvas(img, crop, p.dw, p.dh);
    ctx.drawImage(gray, p.dx, p.dy);
    return canvas;
  }

  const userBg = buildBackgroundCanvas(w, h, bg);
  desaturateInPlace(userBg);
  const mask = makeIconAlphaMask(img, crop, w, h, iconFraction);

  const masked = makeCanvas(w, h);
  const mctx = ctxOf(masked);
  mctx.drawImage(userBg, 0, 0);
  mctx.globalCompositeOperation = "destination-in";
  mctx.drawImage(mask, 0, 0);

  ctx.drawImage(masked, 0, 0);
  return canvas;
}

async function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export type IosSingleColorStyle = "masked" | "solid";

export async function detectSingleColor(iconBase64: string): Promise<boolean> {
  const img = await loadImage(iconBase64);
  return isSingleColor(img, tightCrop(img));
}

export async function generateAllAssets(
  iconBase64: string,
  bgConfig: BackgroundConfig,
  iosSingleColorStyle: IosSingleColorStyle = "masked",
): Promise<AssetFile[]> {
  const img = await loadImage(iconBase64);
  const crop = tightCrop(img);
  const singleColor = isSingleColor(img, crop);
  // Dark honors the user's style choice; tinted always uses the masked
  // gradient for single-color logos so iOS's runtime tint has luminance
  // variation to work with.
  const darkUseBackground = singleColor && iosSingleColorStyle === "masked";
  const tintedUseBackground = singleColor;

  const out: AssetFile[] = [];
  for (const spec of ASSET_SPECS) {
    const [w, h] = spec.size;
    let canvas: HTMLCanvasElement;

    if (spec.variant === "dark") {
      canvas = makeIosDark(w, h, bgConfig, img, crop, spec.iconFraction, darkUseBackground);
    } else if (spec.variant === "tinted") {
      canvas = makeIosTinted(w, h, bgConfig, img, crop, spec.iconFraction, tintedUseBackground);
    } else if (spec.variant === "background") {
      canvas = makeBackgroundOnly(w, h, bgConfig);
    } else if (spec.variant === "monochrome") {
      canvas = makeMonochrome(w, h, img, crop, spec.iconFraction);
    } else {
      canvas = makeStandard(w, h, bgConfig, spec.hasBackground, img, crop, spec.iconFraction);
    }

    out.push({
      name: spec.name,
      width: w,
      height: h,
      has_background: spec.hasBackground,
      platform: spec.platform,
      variant: spec.variant,
      image_base64: canvasToPngBase64(canvas),
    });

    // Let the spinner animate between heavyweight encodes (splash is ~3.5 MP).
    await nextFrame();
  }

  return out;
}
