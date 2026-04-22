import type { BackgroundConfig } from "@/lib/types";

export function backgroundToCss(cfg: BackgroundConfig | null | undefined): string | null {
  if (!cfg) return null;
  if (cfg.type === "solid") {
    return cfg.color ?? null;
  }
  const colors = cfg.colors ?? [];
  if (colors.length < 2) return null;
  const direction = (cfg.direction ?? "to-bottom-right")
    .replace("to-", "to ")
    .replace(/-/g, " ");
  return `linear-gradient(${direction}, ${colors.join(", ")})`;
}
