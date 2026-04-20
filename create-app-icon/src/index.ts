import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import kleur from "kleur";
import { ApiClient, ApiError } from "./api.js";
import { HELP_TEXT, parseArgs } from "./args.js";
import { classifyExplicit, detectExpoConfig } from "./detect.js";
import { patchConfig } from "./patchConfig.js";
import {
  promptBackground,
  promptConfirm,
  promptDescription,
  promptMode,
} from "./prompts.js";
import { writeAssets } from "./writeAssets.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }
  if (args.version) {
    console.log(readVersion());
    return;
  }

  // --web: defer the full browser-callback flow; degrade gracefully.
  if (args.web) {
    console.log(
      kleur.yellow(
        "--web flow isn't available yet. Open the wizard manually:\n  ",
      ) + kleur.bold("https://ai-app-icons.fly.dev"),
    );
    console.log(
      "  Then download the .zip and drop the contents into ./assets/.\n",
    );
    return;
  }

  console.log(kleur.bold().cyan("\ncreate-app-icon\n"));

  const config = args.configPath
    ? classifyExplicit(args.configPath)
    : detectExpoConfig(process.cwd());
  if (!config) {
    fatal(
      "No Expo config found. Run this inside a directory containing " +
        "app.config.ts, app.config.js, app.config.json, or app.json.",
    );
  }
  const relConfig = relative(process.cwd(), config.path) || config.path;
  console.log(kleur.dim(`Found Expo config: ${relConfig}`));

  const api = new ApiClient(args.apiUrl);

  let modes;
  try {
    modes = await api.getModes();
  } catch (err) {
    fatal(apiErrorMessage(err, args.apiUrl));
  }

  // --- prompts ------------------------------------------------------------
  const description = await promptDescription();
  const mode = await promptMode(modes);

  console.log(kleur.dim("\nGenerating your icon..."));
  let imageBase64: string;
  try {
    imageBase64 = await api.generateIcon(description, mode);
  } catch (err) {
    fatal(apiErrorMessage(err, args.apiUrl));
  }
  console.log(kleur.green("  icon generated."));

  const background = await promptBackground();

  console.log(kleur.dim("\nGenerating all asset sizes..."));
  let result;
  try {
    result = await api.generateAssets(imageBase64, background);
  } catch (err) {
    fatal(apiErrorMessage(err, args.apiUrl));
  }
  console.log(kleur.green(`  ${result.assets.length} assets generated.`));

  // --- confirm + write ----------------------------------------------------
  const outputDir = args.output;
  console.log(kleur.bold("\nAbout to write:"));
  console.log(`  ${result.assets.length} PNGs → ${kleur.cyan(outputDir)}/`);
  console.log(`  Patch config → ${kleur.cyan(relConfig)} (with .bak backup)`);

  if (!args.yes) {
    const ok = await promptConfirm("Continue?", true);
    if (!ok) {
      console.log(kleur.yellow("Aborted. No files changed."));
      return;
    }
  }

  const written = writeAssets(result.assets, outputDir);
  for (const w of written) {
    console.log(kleur.green("  wrote"), relative(process.cwd(), w.path));
  }

  const patch = patchConfig(config, result.expo_config as { expo: Record<string, unknown> });
  if (patch.manual) {
    console.log();
    console.log(
      kleur.yellow(
        "Couldn't automatically patch " + relConfig + ". Add this to your Expo config:",
      ),
    );
    console.log();
    console.log(JSON.stringify(result.expo_config, null, 2));
    console.log();
  } else {
    console.log(kleur.green("  patched"), relConfig);
    console.log(
      kleur.dim("  backup  ") + relative(process.cwd(), patch.backupPath),
    );
  }

  console.log(kleur.bold().green("\nDone! Try running `expo start` to see your new icon."));
}

function apiErrorMessage(err: unknown, apiUrl: string): string {
  if (err instanceof ApiError) return `API error (${err.status}): ${err.detail}`;
  if (err instanceof Error) {
    return `Couldn't reach ${apiUrl}: ${err.message}`;
  }
  return `Unexpected error: ${String(err)}`;
}

function fatal(message: string): never {
  console.error(kleur.red("\nError: ") + message);
  process.exit(1);
}

function readVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkgPath = resolve(here, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
    return pkg.version;
  } catch {
    return "unknown";
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(kleur.red("\nUnexpected error: ") + msg);
  process.exit(1);
});
