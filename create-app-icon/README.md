# create-app-icon

Generate AI app icons and wire them into your Expo project in one command.

```sh
npx create-app-icon
```

Run it inside an Expo project. You'll be prompted to describe the icon, pick a
style, and pick a background. The CLI then:

1. Calls the hosted backend at `https://ai-app-icons.fly.dev` to generate the
   icon and all Expo asset sizes.
2. Writes PNGs into the directory that already holds your icon (read from the
   Expo config). Falls back to `./assets/` if no icon is set. Files written:
   `icon.png`, `icon-ios.png`, `icon-ios-dark.png`, `icon-ios-tinted.png`,
   `adaptive-foreground.png`, `adaptive-background.png`,
   `adaptive-monochrome.png`, `splash.png`, `splash-icon.png`, `favicon.png`.
3. Patches your Expo config file in place.

### Overwrites

Assets are written with those fixed filenames. **Any existing file with the
same name in the output directory is overwritten** — there is no backup. Before
writing, the CLI lists every collision and asks you to confirm. Pass `--force`
(or `-y`) to skip that prompt.

Supported config files (auto-detected, in Expo's resolution order):

- `app.config.ts`
- `app.config.js`
- `app.config.json`
- `app.json`

## Non-interactive (`--ai`)

For CI or scripting, `--ai "<description>"` runs with **no prompts and no
browser** — it generates the icon, writes the PNGs, and patches the config in
one shot (implies `--yes`):

```sh
AI_APP_ICONS_API_KEY=cak_... npx create-app-icon --ai "an app icon for kite flying locations"
```

Against the hosted backend this requires an **API key**. Create one at
`https://ai-app-icons.vercel.app/settings/api-keys` and pass it via the
`AI_APP_ICONS_API_KEY` environment variable or `--api-key`. If no key is found
and the backend requires auth, the CLI exits with an error rather than opening a
browser. Self-hosted backends with auth disabled need no key.

## Options

```
--ai <description> Non-interactive: generate from this description with no
                   prompts/browser. Implies --yes. Needs an API key (below).
--api-key <key>    API key for the hosted backend (also: AI_APP_ICONS_API_KEY)
--style <id>       Style/mode id. Defaults to the server's default style.
--background <v>   Background preset id (cream, peach, sage, frost, slate,
                   aurora) or hex (#RGB / #RRGGBB). Default: cream. Alias: --bg.
--output <dir>     Asset output directory. Defaults to the folder that already
                   holds your icon (from the Expo config); falls back to
                   ./assets.
--config <file>    Explicit Expo config path (default: auto-detect)
--api-url <url>    Override backend URL
--web              Force the browser wizard (auto-enabled when the backend
                   requires auth)
--yes, -y          Skip the confirmation prompt
--force, -f        Alias for --yes. Skips confirmation even when existing
                   PNGs would be overwritten.
--help, -h         Show help
--version, -v      Show version
```

Environment: `AI_APP_ICONS_API_URL` overrides the backend URL (same as
`--api-url`); `AI_APP_ICONS_API_KEY` supplies the API key (same as `--api-key`).

## When it can't patch automatically

For `app.config.js` / `app.config.ts`, we look for a direct object literal
export, `module.exports = { ... }`, or an arrow-function form returning an
object literal. If your file does something more unusual (dynamic branches,
imported config, etc.), the CLI will print the exact JSON snippet to add and
leave the file untouched.

## Develop

```sh
pnpm install
pnpm build
node dist/index.js --help
```
