import prompts from "prompts";
import type { BackgroundConfig, ModeInfo } from "./api.js";
import { PRESETS, presetToConfig, type BackgroundPreset } from "./backgrounds.js";

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

  return presetToConfig(preset as BackgroundPreset);
}

export async function promptConfirm(message: string, initial = true): Promise<boolean> {
  const { ok } = await prompts(
    { type: "confirm", name: "ok", message, initial },
    { onCancel },
  );
  return !!ok;
}
