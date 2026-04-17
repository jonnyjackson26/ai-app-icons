"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import BackgroundPreview from "@/components/BackgroundPreview";
import { PRESETS } from "@/lib/backgroundPresets";
import { useWizard } from "@/components/WizardContext";
import type { BackgroundConfig } from "@/lib/types";

type BgType = "preset" | "solid" | "gradient";

const DIRECTIONS = [
  "to-bottom-right",
  "to-bottom",
  "to-right",
  "to-bottom-left",
  "to-top-right",
  "to-top",
  "to-left",
  "to-top-left",
];

function presetGradientCss(colors: string[]): string {
  return `linear-gradient(135deg, ${colors.join(", ")})`;
}

// Derive UI state from a persisted BackgroundConfig so back-nav keeps the user's choices.
function seedFromConfig(cfg: BackgroundConfig): {
  bgType: BgType;
  presetId: string;
  solidColor: string;
  gradColors: string[];
  direction: string;
} {
  if (cfg.type === "solid") {
    return {
      bgType: "solid",
      presetId: PRESETS[0].id,
      solidColor: cfg.color ?? "#1a1a2e",
      gradColors: ["#0f0c29", "#302b63"],
      direction: "to-bottom-right",
    };
  }
  // gradient — check if it matches a preset
  const colors = cfg.colors ?? PRESETS[0].colors;
  const direction = cfg.direction ?? PRESETS[0].direction;
  const matchedPreset = PRESETS.find(
    (p) =>
      p.colors.length === colors.length &&
      p.colors.every((c, i) => c.toLowerCase() === colors[i].toLowerCase()) &&
      p.direction === direction
  );
  if (matchedPreset) {
    return {
      bgType: "preset",
      presetId: matchedPreset.id,
      solidColor: "#1a1a2e",
      gradColors: ["#0f0c29", "#302b63"],
      direction: "to-bottom-right",
    };
  }
  return {
    bgType: "gradient",
    presetId: PRESETS[0].id,
    solidColor: "#1a1a2e",
    gradColors: colors,
    direction,
  };
}

export default function BackgroundStep() {
  const router = useRouter();
  const { data, update } = useWizard();
  const iconBase64 = data.iconBase64!;

  const [bgType, setBgType] = useState<BgType>(() => seedFromConfig(data.backgroundConfig).bgType);
  const [presetId, setPresetId] = useState(() => seedFromConfig(data.backgroundConfig).presetId);
  const [solidColor, setSolidColor] = useState(() => seedFromConfig(data.backgroundConfig).solidColor);
  const [gradColors, setGradColors] = useState(() => seedFromConfig(data.backgroundConfig).gradColors);
  const [direction, setDirection] = useState(() => seedFromConfig(data.backgroundConfig).direction);

  const config: BackgroundConfig = useMemo(() => {
    if (bgType === "preset") {
      const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
      return { type: "gradient", colors: preset.colors, direction: preset.direction };
    }
    if (bgType === "solid") return { type: "solid", color: solidColor };
    return { type: "gradient", colors: gradColors, direction };
  }, [bgType, presetId, solidColor, gradColors, direction]);

  useEffect(() => {
    update({ backgroundConfig: config });
  }, [config, update]);

  const handleGenerate = () => {
    update({ backgroundConfig: config, assets: null });
    router.push("?step=export");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
        Choose a background
      </h2>

      <BackgroundPreview iconBase64={iconBase64} config={config} />

      <div className="grid gap-3 sm:grid-cols-3">
        {(["preset", "solid", "gradient"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setBgType(t)}
            className={`rounded-lg border p-4 text-left transition-colors cursor-pointer ${
              bgType === t
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
              {t}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t === "preset" && "Pick a ready-made gradient"}
              {t === "solid" && "Single solid color"}
              {t === "gradient" && "Custom color gradient"}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {bgType === "preset" && (
          <div className="grid grid-cols-3 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPresetId(p.id)}
                className={`rounded-lg border-2 overflow-hidden cursor-pointer transition-colors ${
                  presetId === p.id
                    ? "border-blue-500"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <div
                  className="h-16 w-full"
                  style={{ background: presetGradientCss(p.colors) }}
                />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 py-1.5">
                  {p.name}
                </p>
              </button>
            ))}
          </div>
        )}

        {bgType === "solid" && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Color
            </label>
            <input
              type="color"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-zinc-300 dark:border-zinc-600"
            />
            <input
              type="text"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 font-mono"
            />
          </div>
        )}

        {bgType === "gradient" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">
                Colors
              </label>
              {gradColors.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => {
                      const updated = [...gradColors];
                      updated[i] = e.target.value;
                      setGradColors(updated);
                    }}
                    className="h-9 w-12 cursor-pointer rounded border border-zinc-300 dark:border-zinc-600"
                  />
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => {
                      const updated = [...gradColors];
                      updated[i] = e.target.value;
                      setGradColors(updated);
                    }}
                    className="w-24 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                  {gradColors.length > 2 && (
                    <button
                      onClick={() =>
                        setGradColors(gradColors.filter((_, j) => j !== i))
                      }
                      className="text-zinc-400 hover:text-red-500 text-sm cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              {gradColors.length < 4 && (
                <button
                  onClick={() => setGradColors([...gradColors, "#24243e"])}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  + Add color
                </button>
              )}
            </div>
          </div>
        )}

        {bgType === "gradient" && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Direction
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100"
            >
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Button onClick={handleGenerate} className="w-full sm:w-auto">
        Generate Assets
      </Button>
    </div>
  );
}
