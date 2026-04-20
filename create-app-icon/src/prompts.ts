import prompts from "prompts";
import type { BackgroundConfig, ModeInfo } from "./api.js";

export interface BackgroundPreset {
  id: string;
  name: string;
  colors: string[];
  direction: string;
}

// Mirrors web/src/lib/backgroundPresets.ts. Duplicated on purpose — five items.
export const PRESETS: BackgroundPreset[] = [
  { id: "sunset", name: "Sunset", colors: ["#ff9966", "#ff5e62"], direction: "to-bottom-right" },
  { id: "ocean", name: "Ocean", colors: ["#2193b0", "#6dd5ed"], direction: "to-bottom" },
  { id: "midnight", name: "Midnight", colors: ["#0f0c29", "#302b63", "#24243e"], direction: "to-bottom-right" },
  { id: "forest", name: "Forest", colors: ["#134e5e", "#71b280"], direction: "to-bottom" },
  { id: "candy", name: "Candy", colors: ["#d53369", "#daae51"], direction: "to-bottom-right" },
  { id: "aurora", name: "Aurora", colors: ["#1d976c", "#93f9b9"], direction: "to-bottom-right" },
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
