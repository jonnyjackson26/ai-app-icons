import prompts from "prompts";
import type { BackgroundConfig, ModeInfo } from "./api.js";

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

function onCancel(): never {
  console.log("\nCancelled.");
  process.exit(130);
}

export async function promptDescription(): Promise<string> {
  const { description } = await prompts(
    {
      type: "text",
      name: "description",
      message: "Describe your app icon",
      validate: (v: string) => (v.trim().length > 0 ? true : "Required"),
    },
    { onCancel },
  );
  return description.trim();
}

export async function promptMode(modes: ModeInfo[]): Promise<string | null> {
  const defaultIdx = Math.max(
    0,
    modes.findIndex((m) => m.is_default),
  );
  const { modeId } = await prompts(
    {
      type: "select",
      name: "modeId",
      message: "Pick a style",
      initial: defaultIdx,
      choices: [
        ...modes.map((m) => ({
          title: m.name,
          description: m.description,
          value: m.id,
        })),
        { title: "Skip", description: "No specific style — let the model decide.", value: "" },
      ],
    },
    { onCancel },
  );
  return modeId === "" ? null : modeId;
}

export async function promptBackground(): Promise<BackgroundConfig> {
  const { preset } = await prompts(
    {
      type: "select",
      name: "preset",
      message: "Pick a background",
      initial: 0,
      choices: [
        ...PRESETS.map((p) => ({
          title: p.name,
          description: p.colors.join(" → "),
          value: p,
        })),
        { title: "Solid color", description: "Enter a custom hex color", value: "__solid__" as const },
      ],
    },
    { onCancel },
  );

  if (preset === "__solid__") {
    const { color } = await prompts(
      {
        type: "text",
        name: "color",
        message: "Hex color (e.g. #1a1a2e)",
        validate: (v: string) =>
          /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim())
            ? true
            : "Use #RGB or #RRGGBB",
      },
      { onCancel },
    );
    return { type: "solid", color: color.trim() };
  }

  const p = preset as BackgroundPreset;
  return { type: "gradient", colors: p.colors, direction: p.direction };
}

export async function promptConfirm(message: string, initial = true): Promise<boolean> {
  const { ok } = await prompts(
    { type: "confirm", name: "ok", message, initial },
    { onCancel },
  );
  return !!ok;
}
