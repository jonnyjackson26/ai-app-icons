// Render an emoji or Lucide SVG onto a 1024x1024 transparent canvas and
// return the base64 PNG (no data URL prefix) so it slots into the same
// `iconBase64` slot as uploaded/AI-generated icons.

const CANVAS_SIZE = 1024;

function canvasToBase64Png(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL("image/png");
  return dataUrl.split(",")[1];
}

export function renderEmojiToBase64(emoji: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  // Most platforms render color emoji glyphs at ~1.0em, but the bounding box
  // includes ascender/descender padding. 780px font in a 1024px canvas leaves
  // ~12% margin on every side once the glyph is centered.
  const fontSize = 780;
  const fontStack =
    '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", system-ui, sans-serif';
  ctx.font = `${fontSize}px ${fontStack}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Nudge upward — most emoji fonts sit slightly low when textBaseline=middle
  // because the baseline metric includes descenders.
  ctx.fillText(emoji, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 30);

  return canvasToBase64Png(canvas);
}

// Take an SVG already in the DOM (e.g. a rendered Lucide icon), recolor the
// strokes/fills, scale it to fill ~78% of the canvas, and rasterize.
export function renderSvgElementToBase64(
  source: SVGElement,
  color: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const clone = source.cloneNode(true) as SVGElement;
    // Lucide ships with width/height="24" by default — strip them so the
    // intrinsic size is taken from viewBox. We re-set explicit dimensions
    // below for consistent serialization.
    clone.removeAttribute("width");
    clone.removeAttribute("height");
    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", "0 0 24 24");
    }
    // Lucide uses currentColor on stroke; force the chosen color directly so
    // the rasterizer doesn't have to chase CSS through an SVG image element
    // (browsers strip external CSS during <img> SVG decoding).
    clone.setAttribute("stroke", color);
    clone.setAttribute("fill", "none");
    clone.setAttribute("stroke-width", "1.6");
    clone.setAttribute("stroke-linecap", "round");
    clone.setAttribute("stroke-linejoin", "round");
    // Required for img.src=svg-data-url to decode correctly in Safari.
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const target = Math.floor(CANVAS_SIZE * 0.78);
    clone.setAttribute("width", String(target));
    clone.setAttribute("height", String(target));

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2d context unavailable");
        const offset = (CANVAS_SIZE - target) / 2;
        ctx.drawImage(img, offset, offset, target, target);
        resolve(canvasToBase64Png(canvas));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("svg rasterization failed"));
    };
    img.src = url;
  });
}
