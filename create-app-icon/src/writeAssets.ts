import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { AssetFile } from "./api.js";

export interface WrittenAsset {
  name: string;
  path: string;
}

export function writeAssets(assets: AssetFile[], outputDir: string): WrittenAsset[] {
  const absDir = resolve(process.cwd(), outputDir);
  mkdirSync(absDir, { recursive: true });
  const written: WrittenAsset[] = [];
  for (const a of assets) {
    const buf = Buffer.from(a.image_base64, "base64");
    const p = join(absDir, a.name);
    writeFileSync(p, buf);
    written.push({ name: a.name, path: p });
  }
  return written;
}
