export interface CliArgs {
  web: boolean;
  webExplicit: boolean;
  yes: boolean;
  help: boolean;
  version: boolean;
  output: string;
  outputExplicit: boolean;
  configPath: string | null;
  apiUrl: string;
  apiUrlOverridden: boolean;
  webUrl: string;
  webTimeoutSec: number;
  ai: string | null;
  apiKey: string | null;
  style: string | null;
  background: string | null;
}

const DEFAULT_API_URL = "https://ai-app-icons.fly.dev";
const DEFAULT_WEB_URL = "https://ai-app-icons.vercel.app";
const DEFAULT_WEB_TIMEOUT_SEC = 600;

export function parseArgs(argv: string[]): CliArgs {
  const envApiUrl = process.env.AI_APP_ICONS_API_URL;
  const args: CliArgs = {
    web: false,
    webExplicit: false,
    yes: false,
    help: false,
    version: false,
    output: "./assets",
    outputExplicit: false,
    configPath: null,
    apiUrl: envApiUrl || DEFAULT_API_URL,
    apiUrlOverridden: !!envApiUrl,
    webUrl: stripTrailingSlash(
      process.env.AI_APP_ICONS_WEB_URL || DEFAULT_WEB_URL,
    ),
    webTimeoutSec: DEFAULT_WEB_TIMEOUT_SEC,
    ai: null,
    apiKey: process.env.AI_APP_ICONS_API_KEY || null,
    style: null,
    background: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--web":
        args.web = true;
        args.webExplicit = true;
        break;
      case "--yes":
      case "-y":
      case "--force":
      case "-f":
        args.yes = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--version":
      case "-v":
        args.version = true;
        break;
      case "--output":
      case "-o":
        args.output = requireValue(argv, ++i, a);
        args.outputExplicit = true;
        break;
      case "--config":
      case "-c":
        args.configPath = requireValue(argv, ++i, a);
        break;
      case "--api-url":
        args.apiUrl = requireValue(argv, ++i, a);
        args.apiUrlOverridden = true;
        break;
      case "--web-url":
        args.webUrl = stripTrailingSlash(requireValue(argv, ++i, a));
        break;
      case "--ai":
        args.ai = requireValue(argv, ++i, a);
        break;
      case "--api-key":
        args.apiKey = requireValue(argv, ++i, a);
        break;
      case "--style":
        args.style = requireValue(argv, ++i, a);
        break;
      case "--background":
      case "--bg":
        args.background = requireValue(argv, ++i, a);
        break;
      case "--web-timeout": {
        const raw = requireValue(argv, ++i, a);
        const n = Number(raw);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error(`--web-timeout must be a positive number of seconds (got ${raw})`);
        }
        args.webTimeoutSec = n;
        break;
      }
      default:
        if (a && a.startsWith("-")) {
          throw new Error(`Unknown flag: ${a}`);
        }
    }
  }
  return args;
}

function requireValue(argv: string[], i: number, flag: string): string {
  const v = argv[i];
  if (!v || v.startsWith("-")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return v;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export const HELP_TEXT = `create-app-icon — generate AI app icons and wire them into your Expo project.

Usage:
  npx create-app-icon [options]
  npx create-app-icon --ai "<description>" [options]

Non-interactive (--ai):
  --ai <description>     Generate from this description with no prompts and no
                         browser. Implies --yes. Requires an API key against the
                         hosted backend (see below).
  --api-key <key>        API key for the hosted backend. Also read from the
                         AI_APP_ICONS_API_KEY environment variable. Create one at
                         <web-url>/settings/api-keys.
  --style <id>           Style/mode id (see the wizard). Defaults to the server's
                         default style.
  --background <value>   Background as a preset id (cream, peach, sage, frost,
                         slate, aurora) or a hex color (#RGB / #RRGGBB).
                         Defaults to cream. Alias: --bg.

Options:
  --output <dir>         Where to write PNG assets. Defaults to the directory
                         that already contains your icon (from the Expo
                         config); falls back to ./assets if no icon is set.
  --config <file>        Explicit path to Expo config (default: auto-detect)
  --api-url <url>        Override backend URL (also: AI_APP_ICONS_API_URL)
  --web                  Force the browser wizard. Auto-enabled when the
                         backend requires auth.
  --web-url <url>        Override the hosted wizard URL
                         (default: https://ai-app-icons.vercel.app)
  --web-timeout <sec>    Timeout for the browser flow (default: 600)
  --yes, -y              Skip the final confirmation prompt
  --force, -f            Alias for --yes. Skips the confirmation even when
                         existing PNGs in the output directory would be
                         overwritten.
  --help, -h             Show this help
  --version, -v          Show version

Runs inside an Expo project and expects to find one of:
  app.config.ts   app.config.js   app.config.json   app.json

Self-hosting: point --api-url (or AI_APP_ICONS_API_URL) at your own deployment.
When the server does not require auth, the terminal flow is available.
`;
