export interface CliArgs {
  web: boolean;
  yes: boolean;
  help: boolean;
  version: boolean;
  output: string;
  configPath: string | null;
  apiUrl: string;
}

const DEFAULT_API_URL = "https://ai-app-icons.fly.dev";

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    web: false,
    yes: false,
    help: false,
    version: false,
    output: "./assets",
    configPath: null,
    apiUrl: process.env.AI_APP_ICONS_API_URL || DEFAULT_API_URL,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--web":
        args.web = true;
        break;
      case "--yes":
      case "-y":
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
        break;
      case "--config":
      case "-c":
        args.configPath = requireValue(argv, ++i, a);
        break;
      case "--api-url":
        args.apiUrl = requireValue(argv, ++i, a);
        break;
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

export const HELP_TEXT = `create-app-icon — generate AI app icons and wire them into your Expo project.

Usage:
  npx create-app-icon [options]

Options:
  --output <dir>         Where to write PNG assets (default: ./assets)
  --config <file>        Explicit path to Expo config (default: auto-detect)
  --api-url <url>        Override backend URL
  --web                  Open the browser wizard (coming soon; for now it
                         prints the URL and exits)
  --yes, -y              Skip the final confirmation prompt
  --help, -h             Show this help
  --version, -v          Show version

Runs inside an Expo project and expects to find one of:
  app.config.ts   app.config.js   app.config.json   app.json
`;
