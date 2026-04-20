# create-app-icon

Generate AI app icons and wire them into your Expo project in one command.

```sh
npx create-app-icon
```

Run it inside an Expo project. You'll be prompted to describe the icon, pick a
style, and pick a background. The CLI then:

1. Calls the hosted backend at `https://ai-app-icons.fly.dev` to generate the
   icon and all Expo asset sizes.
2. Writes PNGs into `./assets/` (icon, iOS light/dark/tinted, Android adaptive
   foreground/background/monochrome, splash, web favicon).
3. Patches your Expo config file in place (creates a `.bak` first).

Supported config files (auto-detected, in Expo's resolution order):

- `app.config.ts`
- `app.config.js`
- `app.config.json`
- `app.json`

## Options

```
--output <dir>     Asset output directory (default: ./assets)
--config <file>    Explicit Expo config path (default: auto-detect)
--api-url <url>    Override backend URL
--web              Open the browser wizard (coming soon; currently prints the URL)
--yes, -y          Skip the final confirmation prompt
--help, -h         Show help
--version, -v      Show version
```

Environment: `AI_APP_ICONS_API_URL` overrides the backend URL, same as
`--api-url`.

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
