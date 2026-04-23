import { readFileSync } from "node:fs";
import { posix } from "node:path";
import { parse as babelParse } from "@babel/parser";
import * as t from "@babel/types";
import * as recast from "recast";
import type { DetectedConfig } from "./detect.js";
import { findObjectProperty, findTargetObject } from "./patchConfig.js";

// Fields that, by convention, hold the user's primary icon path. Order
// matters — we take the first one that resolves to a string.
const ICON_KEY_PATHS: readonly string[][] = [
  ["icon"],
  ["ios", "icon", "light"],
  ["ios", "icon"],
  ["android", "adaptiveIcon", "foregroundImage"],
];

/**
 * Returns the directory (relative to the Expo config file) where the user's
 * existing primary icon lives, e.g. "./assets/icons". Returns null when we
 * can't find any known icon field — the caller should fall back to the
 * default output directory.
 */
export function readExpoIconDir(config: DetectedConfig): string | null {
  const iconPath = readIconPath(config);
  if (!iconPath) return null;
  const normalized = iconPath.replace(/\\/g, "/");
  const withDot =
    normalized.startsWith(".") || normalized.startsWith("/")
      ? normalized
      : "./" + normalized;
  const dir = posix.dirname(withDot);
  return dir;
}

function readIconPath(config: DetectedConfig): string | null {
  if (config.kind === "json" || config.kind === "json-config") {
    return readJsonIconPath(config.path);
  }
  return readAstIconPath(config.path, config.kind === "ts");
}

function readJsonIconPath(filePath: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  // app.json wraps everything under "expo"; app.config.json may not.
  const expo = isPlainObject(parsed.expo) ? parsed.expo : parsed;
  for (const path of ICON_KEY_PATHS) {
    const v = getPath(expo, path);
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function readAstIconPath(filePath: string, isTs: boolean): string | null {
  let ast: unknown;
  try {
    const source = readFileSync(filePath, "utf8");
    ast = recast.parse(source, {
      parser: {
        parse: (src: string) =>
          babelParse(src, {
            sourceType: "module",
            allowImportExportEverywhere: true,
            plugins: isTs ? ["typescript"] : [],
          }),
      },
    });
  } catch {
    return null;
  }
  const target = findTargetObject(ast);
  if (!target) return null;
  const expoProp = findObjectProperty(target, "expo");
  const expoObj =
    expoProp && t.isObjectExpression(expoProp.value)
      ? expoProp.value
      : target;
  for (const path of ICON_KEY_PATHS) {
    const v = readAstStringAt(expoObj, path);
    if (v) return v;
  }
  return null;
}

function readAstStringAt(
  root: t.ObjectExpression,
  path: readonly string[],
): string | null {
  const lastKey = path[path.length - 1];
  if (lastKey === undefined) return null;
  let current: t.ObjectExpression = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (key === undefined) return null;
    const prop = findObjectProperty(current, key);
    if (!prop || !t.isObjectExpression(prop.value)) return null;
    current = prop.value;
  }
  const last = findObjectProperty(current, lastKey);
  if (!last) return null;
  if (t.isStringLiteral(last.value)) return last.value.value || null;
  return null;
}

function getPath(obj: unknown, keys: readonly string[]): unknown {
  let cur: unknown = obj;
  for (const k of keys) {
    if (!isPlainObject(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
