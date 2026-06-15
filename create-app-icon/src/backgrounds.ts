import type { BackgroundConfig } from "./api.js";

export interface BackgroundPreset {
  id: string;
  name: string;
  colors: string[];
  direction: string;
}

// Mirrors a small curated subset of web/src/lib/backgroundPresets.ts.
// Kept Apple-style and intentionally short so the CLI prompt stays readable.
export const PRESETS: BackgroundPreset[] = [
  { id: "cream",    name: "Cream",    colors: ["#ffffff", "#f3f0e7"], direction: "to-bottom-right" },
  { id: "peach",    name: "Peach",    colors: ["#ffecd2", "#fcb69f"], direction: "to-bottom-right" },
  { id: "sage",     name: "Sage",     colors: ["#e3ebe3", "#b5c9b5"], direction: "to-bottom-right" },
  { id: "frost",    name: "Frost",    colors: ["#e3f2fd", "#bbdefb"], direction: "to-bottom-right" },
  { id: "slate",    name: "Slate",    colors: ["#e2e8f0", "#cbd5e1"], direction: "to-bottom-right" },
  { id: "aurora",   name: "Aurora",   colors: ["#1d976c", "#93f9b9"], direction: "to-bottom-right" },
];

// The interactive prompt opens on the first preset; --ai falls back to the
// same default when --background is omitted, so both paths agree.
export const DEFAULT_BACKGROUND_ID = PRESETS[0]!.id;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function presetToConfig(p: BackgroundPreset): BackgroundConfig {
  return { type: "gradient", colors: p.colors, direction: p.direction };
}

/**
 * Resolve a --background value (or null) to a BackgroundConfig. Accepts a
 * preset id (case-insensitive, e.g. "sage") or a hex color (#RGB / #RRGGBB).
 * Falls back to the default preset when input is null/empty. Throws on an
 * unrecognized value so non-interactive callers fail loudly.
 */
export function resolveBackground(input: string | null): BackgroundConfig {
  const raw = (input ?? "").trim();
  if (!raw) {
    return presetToConfig(PRESETS.find((p) => p.id === DEFAULT_BACKGROUND_ID)!);
  }
  if (HEX_RE.test(raw)) {
    return { type: "solid", color: raw };
  }
  const preset = PRESETS.find((p) => p.id === raw.toLowerCase());
  if (preset) {
    return presetToConfig(preset);
  }
  throw new Error(
    `Unknown --background "${raw}". Use a hex color (#RGB or #RRGGBB) or one of: ` +
      PRESETS.map((p) => p.id).join(", "),
  );
}
