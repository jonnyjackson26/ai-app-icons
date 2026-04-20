import { existsSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

export type ConfigKind = "ts" | "js" | "json-config" | "json";

export interface DetectedConfig {
  path: string;
  kind: ConfigKind;
}

const CANDIDATES: Array<{ name: string; kind: ConfigKind }> = [
  { name: "app.config.ts", kind: "ts" },
  { name: "app.config.js", kind: "js" },
  { name: "app.config.json", kind: "json-config" },
  { name: "app.json", kind: "json" },
];

/** Walk upward from `start` looking for an Expo config file. */
export function detectExpoConfig(start: string): DetectedConfig | null {
  let dir = resolve(start);
  while (true) {
    for (const c of CANDIDATES) {
      const p = join(dir, c.name);
      if (existsSync(p) && statSync(p).isFile()) {
        return { path: p, kind: c.kind };
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Classify an explicit path the user passed via --config. */
export function classifyExplicit(path: string): DetectedConfig {
  const abs = isAbsolute(path) ? path : resolve(process.cwd(), path);
  if (!existsSync(abs)) {
    throw new Error(`Config file not found: ${abs}`);
  }
  if (abs.endsWith(".ts")) return { path: abs, kind: "ts" };
  if (abs.endsWith(".js") || abs.endsWith(".cjs") || abs.endsWith(".mjs")) {
    return { path: abs, kind: "js" };
  }
  if (abs.endsWith("app.config.json")) return { path: abs, kind: "json-config" };
  if (abs.endsWith(".json")) return { path: abs, kind: "json" };
  throw new Error(`Unsupported config file extension: ${abs}`);
}
