"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import BackgroundPreview from "@/components/BackgroundPreview";
import { PRESETS } from "@/lib/backgroundPresets";
import { useWizard } from "@/components/WizardContext";
import type { BackgroundConfig } from "@/lib/types";

// Keep in sync with api/src/ai_app_icons/constants.py (IOS_DARK_BG).
const IOS_DARK_BG = "#262427";

const SOLID_QUICK_PICKS: { id: string; name: string; color: string }[] = [
  { id: "white", name: "White", color: "#ffffff" },
  { id: "ios-dark", name: "iOS Dark", color: IOS_DARK_BG },
  { id: "black", name: "Black", color: "#000000" },
];

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

function presetGradientCss(colors: string[], direction = "to-bottom-right"): string {
  const css = direction.replace("to-", "to ").replace(/-/g, " ");
  return `linear-gradient(${css}, ${colors.join(", ")})`;
}

function colorsEqual(a: string[], b: string[]): boolean {
  return (
    a.length === b.length &&
    a.every((c, i) => c.toLowerCase() === b[i].toLowerCase())
  );
}

interface Seed {
  bgType: "solid" | "gradient";
  solidColor: string;
  gradColors: string[];
  direction: string;
}

function seedFromConfig(cfg: BackgroundConfig): Seed {
  if (cfg.type === "solid") {
    return {
      bgType: "solid",
      solidColor: cfg.color ?? "#ffffff",
      gradColors: ["#0f0c29", "#302b63"],
      direction: "to-bottom-right",
    };
  }
  return {
    bgType: "gradient",
    solidColor: "#ffffff",
    gradColors: cfg.colors ?? PRESETS[0].colors,
    direction: cfg.direction ?? PRESETS[0].direction,
  };
}

export default function BackgroundStep() {
  const router = useRouter();
  const { data, update } = useWizard();
  const iconBase64 = data.iconBase64!;

  const initial = seedFromConfig(data.backgroundConfig);
  const [bgType, setBgType] = useState<"solid" | "gradient">(initial.bgType);
  const [solidColor, setSolidColor] = useState(initial.solidColor);
  const [gradColors, setGradColors] = useState(initial.gradColors);
  const [direction, setDirection] = useState(initial.direction);

  const config: BackgroundConfig = useMemo(() => {
    if (bgType === "solid") return { type: "solid", color: solidColor };
    return { type: "gradient", colors: gradColors, direction };
  }, [bgType, solidColor, gradColors, direction]);

  useEffect(() => {
    update({ backgroundConfig: config });
  }, [config, update]);

  const handleGenerate = () => {
    update({ backgroundConfig: config, assets: null });
    router.push("?step=export");
  };

  const activePresetId =
    bgType === "gradient"
      ? PRESETS.find(
          (p) => colorsEqual(p.colors, gradColors) && p.direction === direction,
        )?.id ?? null
      : null;

  const activeQuickId =
    bgType === "solid"
      ? SOLID_QUICK_PICKS.find(
          (p) => p.color.toLowerCase() === solidColor.toLowerCase(),
        )?.id ?? null
      : null;

  const customSolidActive =
    bgType === "solid" && activeQuickId === null;

  const pickQuickSolid = (color: string) => {
    setBgType("solid");
    setSolidColor(color);
  };

  const pickPreset = (preset: (typeof PRESETS)[number]) => {
    setBgType("gradient");
    setGradColors(preset.colors);
    setDirection(preset.direction);
  };

  const updateGradColor = (i: number, value: string) => {
    setBgType("gradient");
    const updated = [...gradColors];
    updated[i] = value;
    setGradColors(updated);
  };

  const removeGradColor = (i: number) => {
    if (gradColors.length <= 2) return;
    setBgType("gradient");
    setGradColors(gradColors.filter((_, j) => j !== i));
  };

  const addGradColor = () => {
    if (gradColors.length >= 4) return;
    setBgType("gradient");
    setGradColors([...gradColors, "#24243e"]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Choose a background
      </h2>

      <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
        <div className="md:shrink-0 md:sticky md:top-4">
          <BackgroundPreview iconBase64={iconBase64} config={config} />
        </div>

        <div className="flex-1 min-w-0 space-y-8">

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
          Solid color
        </h3>
        <div className="flex flex-wrap gap-2">
          {SOLID_QUICK_PICKS.map((pick) => {
            const isActive = activeQuickId === pick.id;
            return (
              <button
                key={pick.id}
                onClick={() => pickQuickSolid(pick.color)}
                className={`flex items-center gap-2 rounded-full border pl-1.5 pr-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? "border-blue-500 ring-2 ring-blue-300 dark:ring-blue-800 bg-blue-50 dark:bg-blue-950/40"
                    : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <span
                  className="block h-6 w-6 rounded-full border border-zinc-300 dark:border-zinc-600"
                  style={{ backgroundColor: pick.color }}
                />
                <span className="text-zinc-800 dark:text-zinc-100">
                  {pick.name}
                </span>
              </button>
            );
          })}

          <label
            className={`flex items-center gap-2 rounded-full border pl-1.5 pr-3 py-1.5 text-sm transition-colors cursor-pointer ${
              customSolidActive
                ? "border-blue-500 ring-2 ring-blue-300 dark:ring-blue-800 bg-blue-50 dark:bg-blue-950/40"
                : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            <span className="relative block h-6 w-6 rounded-full border border-zinc-300 dark:border-zinc-600 overflow-hidden">
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "conic-gradient(from 0deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ef4444)",
                }}
              />
              <input
                type="color"
                value={solidColor}
                onChange={(e) => pickQuickSolid(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Pick a custom color"
              />
            </span>
            <span className="text-zinc-800 dark:text-zinc-100">
              {customSolidActive ? solidColor.toUpperCase() : "Custom"}
            </span>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
          Gradient
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((p) => {
            const isActive = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => pickPreset(p)}
                className={`rounded-xl overflow-hidden transition-all cursor-pointer ${
                  isActive
                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
                    : "ring-1 ring-zinc-200 dark:ring-zinc-700 hover:ring-zinc-300 dark:hover:ring-zinc-600"
                }`}
              >
                <div
                  className="h-16 w-full"
                  style={{ background: presetGradientCss(p.colors, p.direction) }}
                />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 py-1.5 text-center bg-white dark:bg-zinc-900">
                  {p.name}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            Customize gradient
          </h3>
          {bgType === "gradient" && activePresetId === null && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Active
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {gradColors.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
            >
              <input
                type="color"
                value={c}
                onChange={(e) => updateGradColor(i, e.target.value)}
                className="h-7 w-9 cursor-pointer rounded border border-zinc-300 dark:border-zinc-600"
              />
              <input
                type="text"
                value={c}
                onChange={(e) => updateGradColor(i, e.target.value)}
                className="w-20 bg-transparent text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              {gradColors.length > 2 && (
                <button
                  onClick={() => removeGradColor(i)}
                  className="text-zinc-400 hover:text-red-500 text-sm cursor-pointer leading-none px-1"
                  aria-label={`Remove color stop ${i + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {gradColors.length < 4 && (
            <button
              onClick={addGradColor}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
            >
              + Add color
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Direction
          </label>
          <select
            value={direction}
            onChange={(e) => {
              setBgType("gradient");
              setDirection(e.target.value);
            }}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100"
          >
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="pt-2">
        <Button onClick={handleGenerate} className="w-full sm:w-auto">
          Generate Assets
        </Button>
      </div>
        </div>
      </div>
    </div>
  );
}
