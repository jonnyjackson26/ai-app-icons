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
import {
  deleteCredentials,
  readCredentials,
} from "./credentials.js";
import { runLogin } from "./login.js";
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

  if (args.subcommand === "logout") {
    const removed = deleteCredentials();
    if (removed) {
      console.log(kleur.green("Signed out. Credentials removed."));
    } else {
      console.log(kleur.dim("No credentials on file."));
    }
    return;
  }

  if (args.subcommand === "login") {
    await runLogin({
      webUrl: args.webUrl,
      apiUrl: args.apiUrl,
      timeoutMs: args.webTimeoutSec * 1000,
    });
    return;
  }

  console.log(kleur.bold().cyan("\ncreate-app-icon\n"));

  // Probe server config before prompting the user for a description. If the
  // server requires auth and we have no credentials, print the login/self-host
  // prompt and exit.
  const authToken = await resolveAuth(args);

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
    result = await runTerminalFlow(args, authToken);
  }

  await finalizeResult(args, config, relConfig, result);
}

/**
 * Returns a bearer token if auth is required and present, null if auth is
 * not required (self-host), or exits with a prompt if auth is required but
 * credentials are missing.
 */
async function resolveAuth(args: CliArgs): Promise<string | null> {
  const probeClient = new ApiClient(args.apiUrl);
  let authRequired: boolean;
  try {
    const config = await probeClient.getConfig();
    authRequired = config.auth_required;
  } catch {
    // /config probe failed. Could be a self-host without the endpoint, or
    // a network issue. Assume no auth and let downstream 401s drive the UX.
    return null;
  }

  if (!authRequired) return null;

  const creds = readCredentials();
  if (creds?.token) return creds.token;

  printLoginOrSelfHost(args);
  process.exit(1);
}

function printLoginOrSelfHost(args: CliArgs): void {
  console.log();
  console.log(
    kleur.bold(
      "This uses AI to create an app icon, please sign in or self-host.",
    ),
  );
  console.log();
  console.log(
    "  " + kleur.cyan("Sign in:   ") + "npx create-app-icon login",
  );
  console.log(
    "  " +
      kleur.cyan("Self-host: ") +
      "https://github.com/Jonathan/ai-app-icons#self-hosting",
  );
  console.log();
  if (!args.apiUrlOverridden) {
    console.log(
      kleur.dim(
        "Pointing at the default hosted API (" + args.apiUrl + ").",
      ),
    );
    console.log(
      kleur.dim(
        "Override with --api-url <url> or AI_APP_ICONS_API_URL to use your own backend.",
      ),
    );
  }
  console.log();
}

async function runTerminalFlow(
  args: CliArgs,
  authToken: string | null,
): Promise<AssetsResponse> {
  const api = new ApiClient(args.apiUrl, authToken);

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
        "Authentication failed. Run `npx create-app-icon login` to sign in, " +
        "or `--api-url <url>` to point at a self-hosted backend."
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
