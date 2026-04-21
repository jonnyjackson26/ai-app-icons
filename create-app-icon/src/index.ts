import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import kleur from "kleur";
import { ApiClient, ApiError, type AssetsResponse } from "./api.js";
import { HELP_TEXT, parseArgs, type CliArgs } from "./args.js";
import {
  classifyExplicit,
  detectExpoConfig,
  type DetectedConfig,
} from "./detect.js";
import { patchConfig } from "./patchConfig.js";
import {
  promptBackground,
  promptConfirm,
  promptDescription,
  promptMode,
} from "./prompts.js";
import { runWebFlow } from "./webFlow.js";
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

  console.log(kleur.bold().cyan("\ncreate-app-icon\n"));

  // Probe the backend. If it requires auth, force the browser wizard — that's
  // where login happens. The terminal flow is only available when the server
  // doesn't require auth (self-host) because the CLI itself has no way to
  // mint a JWT.
  const authRequired = await probeAuthRequired(args.apiUrl);
  if (authRequired && !args.web) {
    console.log(
      kleur.dim(
        "This backend requires sign-in. Launching the browser wizard...",
      ),
    );
    args.web = true;
  }

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

  let result: AssetsResponse;
  if (args.web) {
    result = await runWebFlow({
      webUrl: args.webUrl,
      timeoutMs: args.webTimeoutSec * 1000,
    });
    console.log(kleur.green(`\n  ${result.assets.length} assets received.`));
  } else {
    result = await runTerminalFlow(args);
  }

  await finalizeResult(args, config, relConfig, result);
}

/**
 * Returns true if the backend requires auth, false otherwise. On network
 * errors or missing /config (older self-hosts), assumes no auth — downstream
 * 401s will surface a clear message.
 */
async function probeAuthRequired(apiUrl: string): Promise<boolean> {
  try {
    const config = await new ApiClient(apiUrl).getConfig();
    return !!config.auth_required;
  } catch {
    return false;
  }
}

async function runTerminalFlow(args: CliArgs): Promise<AssetsResponse> {
  const api = new ApiClient(args.apiUrl);

  let modes;
  try {
    modes = await api.getModes();
  } catch (err) {
    fatal(apiErrorMessage(err, args.apiUrl));
  }

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
  let result: AssetsResponse;
  try {
    result = await api.generateAssets(imageBase64, background);
  } catch (err) {
    fatal(apiErrorMessage(err, args.apiUrl));
  }
  console.log(kleur.green(`  ${result.assets.length} assets generated.`));
  return result;
}

async function finalizeResult(
  args: CliArgs,
  config: DetectedConfig,
  relConfig: string,
  result: AssetsResponse,
): Promise<void> {
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

  const patch = patchConfig(
    config,
    result.expo_config as { expo: Record<string, unknown> },
  );
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

  console.log(
    kleur.bold().green("\nDone! Try running `expo start` to see your new icon."),
  );
}

function apiErrorMessage(err: unknown, apiUrl: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return (
        "The backend requires sign-in. Re-run without --api-url to use " +
        "the hosted wizard, or point --api-url at a self-hosted backend that " +
        "doesn't require auth."
      );
    }
    if (err.status === 429) {
      return (
        "Quota exceeded for this week. Manage your plan at " +
        (process.env.AI_APP_ICONS_WEB_URL || "https://ai-app-icons.vercel.app") +
        "/billing"
      );
    }
    return `API error (${err.status}): ${err.detail}`;
  }
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
