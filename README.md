# AI App Icons

Generate mobile app icon assets using AI. Describe your icon in plain English, refine it through conversation, and export all the sizes you need for Expo/React Native.

Try it by using `npx create-app-icon` in your expo app, or by visiting \[<https://ai-app-icons.vercel.app/>\](<https://ai-app-icons.vercel.app/>). 

Available as an `npx` **command for Expo projects**, a **terminal CLI**, a **Python library**, a **REST API**, and a **web app**.

## Project structure

```
ai-app-icons/
  api/                        # Python package — FastAPI, CLI, core library
    pyproject.toml
    Dockerfile
    fly.toml
    src/ai_app_icons/
      icon_gen.py              # AI icon generation (OpenAI)
      assets.py                # generate all 5 asset sizes
      session.py               # session state
      api/                     # REST API (FastAPI)
      cli/                     # interactive terminal UI (rich)
      background/              # background generators
  web/                         # Next.js web app
    src/
      app/                     # App Router (layout, page)
      components/              # Wizard, steps, UI
      lib/                     # API client, types, download helpers
  create-app-icon/             # npm package — `npx create-app-icon`
    package.json
    src/
      index.ts                 # entrypoint — prompts, orchestration
      detect.ts                # find app.json / app.config.{js,ts,json}
      patchConfig.ts           # merge into existing Expo config
      api.ts prompts.ts args.ts writeAssets.ts deepMerge.ts
  docs/
    deployment.md
```

## Quick start

```bash
git clone https://github.com/jonnyjackson26/ai-app-icons.git
cd ai-app-icons
```

Create a `.env` file at the repo root with your OpenAI key:

```
OPENAI_API_KEY=sk-...
```

### `npx create-app-icon` (for Expo projects)

Run this inside an existing Expo project — it prompts for a description, generates the icon + all asset sizes via the hosted API, writes PNGs into `./assets/`, and patches your Expo config (`app.json`, `app.config.json`, `app.config.js`, or `app.config.ts`) in place with a `.bak` backup.

```bash
cd path/to/your-expo-app
npx create-app-icon
```

Calls `https://ai-app-icons.fly.dev` by default; override with `--api-url` or `AI_APP_ICONS_API_URL`. See [create-app-icon/README.md](create-app-icon/README.md) for all flags.

### CLI (Python, interactive)

```bash
cd api && pip install -e ".[cli]"
ai-app-icons
```

### REST API

```bash
cd api && pip install -e ".[api]"
uvicorn ai_app_icons.api.main:app --reload
```

API runs at `http://localhost:8000`. Open `/docs` for Swagger UI.

**Optional telemetry (Sentry).** Install with `pip install -e ".[api,telemetry]"` and set `SENTRY_DSN` to your own Sentry project to capture errors, traces, profiles, and logs. With no DSN set, Sentry is not initialized. Tune `SENTRY_TRACES_SAMPLE_RATE` and `SENTRY_PROFILE_SESSION_SAMPLE_RATE` (0.0–1.0) in production to stay within your Sentry quota.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/generate` | Generate icon from a text description (optional `mode` field) |
| POST | `/edit` | Edit an existing icon with an instruction |
| POST | `/assets` | Generate all 5 asset sizes from an icon |
| GET | `/backgrounds` | List available background types |
| GET | `/health` | Health check |

### Python library

```bash
cd api && pip install -e .
```

```python
from ai_app_icons import generate_icon, edit_icon, generate_all_assets
from pathlib import Path

icon = generate_icon("A friendly robot for a coding app")
edited, message = edit_icon(icon, "Make the colors warmer")
generate_all_assets(edited, {"type": "gradient", "colors": ["#0f0c29", "#302b63"]}, Path("output"))
```

### Web app

Run both the API and the web app:

```bash
# Terminal 1 — API
cd api && pip install -e ".[api]"
uvicorn ai_app_icons.api.main:app --reload

# Terminal 2 — web app
cd web && npm install && npm run dev
```

Open `http://localhost:3000`. To point at a deployed API, set `NEXT_PUBLIC_API_URL` in `web/.env.local`.

## Style modes

When generating an icon, you can pick a visual style. The CLI asks after you enter your description; the web app shows a grid below the prompt textarea; the REST API takes an optional `mode` field on `POST /generate`.

| id | Style | Vibe |
| --- | --- | --- |
| `flat` *(default)* | Flat | Bold geometric shapes, solid colors, no shadows. |
| `ios-liquid-glass` | iOS Liquid Glass | Glossy translucent material with soft refraction. |
| `single-color` | Single Color | One-color silhouette on transparent background. |
| `3d` | 3D | Rendered 3D object with soft lighting and depth. |

Mode definitions live in two places:

- `api/src/ai_app_icons/modes.py` — **source of truth**, including the style prompt text that gets injected into the icon-generation prompt.
- `web/src/lib/generationModes.ts` — display metadata only (id, name, description) for the web UI, following the same pattern as `backgroundPresets.ts`.

If you add, rename, or remove a mode, update **both** files. The id strings must match exactly.

## Generated assets

| File | Size | Background | Use |
| --- | --- | --- | --- |
| `splash.png` | 1284x2778 | Configured | Expo splash screen |
| `icon.png` | 1024x1024 | Configured | App store icon |
| `adaptive-icon.png` | 1024x1024 | Configured | Android adaptive icon |
| `splash-icon.png` | 1024x1024 | Transparent | Expo splash icon (no bg) |
| `favicon.png` | 48x48 | Transparent | Web favicon |

## Background types

- **Solid color**: `{"type": "solid", "color": "#1a1a2e"}`
- **Gradient**: `{"type": "gradient", "colors": ["#0f0c29", "#302b63"], "direction": "to-bottom"}`
- **Image**: `{"type": "image", "path": "background.png"}`

## Deployment

See docs/deployment.md — API on Fly.io, web app on Vercel.

## Developing `create-app-icon` locally

The package lives in `create-app-icon/` and is published as a single-file ESM bundle in `dist/`. You don't need to publish to npm (or run `npx`) while iterating — just build and invoke `dist/index.js` directly.

### First-time setup

```bash
cd create-app-icon
npm install
npm run build        # produces dist/index.js
```

### The fast iteration loop

Run `build` in watch mode in one terminal:

```bash
cd create-app-icon
npm run dev          # tsup --watch; rebuilds dist/ on every save
```

Then in a scratch Expo project, point Node at the local bundle:

```bash
cd /path/to/your-expo-project     # must contain app.json / app.config.*
node /path/to/ai-app-icons/create-app-icon/dist/index.js --help
node /path/to/ai-app-icons/create-app-icon/dist/index.js        # terminal flow
node /path/to/ai-app-icons/create-app-icon/dist/index.js --web  # browser flow
```

### Running against your local API + web app

When you're also editing the Python API or Next web app, point the CLI at `localhost` so you're not bouncing through fly.dev/Vercel:

```bash
# Terminal 1: Python API
cd api && uvicorn ai_app_icons.api.main:app --reload
# Terminal 2: Next web app
cd web && npm run dev
# Terminal 3: tsup watch
cd create-app-icon && npm run dev
# Terminal 4: scratch Expo project
cd /path/to/expo-project
node /path/to/ai-app-icons/create-app-icon/dist/index.js \
  --api-url http://localhost:8000 \
  --web-url http://localhost:3000 \
  --web
```

When CLI mode is active, the wizard shows a blue "Connected to create-app-icon CLI" badge above the step indicator — if you don't see it, the query-string handshake failed (usually a stale dev server; restart `npm run dev` in `web/`).

### Linking globally (optional)

If you want `create-app-icon` on your `PATH` without typing the full `dist/index.js` path:

```bash
cd create-app-icon
npm link
# now `create-app-icon` works globally
```

Undo with `npm unlink -g create-app-icon`.

### Typecheck / sanity-check before publishing

```bash
cd create-app-icon
npm run typecheck     # tsc --noEmit across src/
npm run build         # fresh dist/index.js
node dist/index.js --help
node dist/index.js --version
```

## Publishing `create-app-icon` to npm

### Version bumping (semver)

The package follows [semver](https://semver.org/). Pick the bump that matches the smallest blast radius of the change:

| Change | Bump | Example |
| --- | --- | --- |
| Bug fix, internal refactor, dep bump with no behavior change | `patch` | `0.2.1` → `0.2.2` |
| New flag, new feature, new supported Expo config layout, anything additive and backward-compatible | `minor` | `0.2.1` → `0.3.0` |
| Removed / renamed flag, changed default behavior, dropped Node version support, anything that could break an existing user's workflow | `major` | `0.2.1` → `1.0.0` |

While we're pre-1.0 (current), a `minor` bump is allowed to carry breaking changes too — but bumping to `0.x.0` instead of `0.x.y` signals users to read the release notes. Once you ship `1.0.0`, stick to the table above strictly.

### Release flow

```bash
cd create-app-icon

# 1. (one-time) log in to npm
npm login

# 2. Make sure main is green: typecheck, build, smoke-test locally
npm run typecheck
npm run build
node dist/index.js --help

# 3. Bump the version. This edits package.json, commits, and creates
#    a local `v0.2.1` git tag (no push yet).
npm version patch         # or: minor / major

# 4. Dry-run to eyeball the file list, size, and metadata npm will upload.
npm publish --dry-run

# 5. Push the version commit + tag
git push && git push --tags

# 6. Publish. For first publish of a scoped name, add --access public.
npm publish
```

`npm publish` runs scripts in this order: `prepublishOnly` → `prepare` → `publish` → `postpublish`. The `files` array in `package.json` is the allowlist of what gets uploaded — currently just `dist/` and `README.md`. The full repo is **not** uploaded.

### After publishing

- Test the registry copy end-to-end, not just your local build:

  ```bash
  cd /tmp && mkdir scratch-expo && cd scratch-expo
  printf '{"expo":{"name":"t","slug":"t"}}' > app.json
  npx create-app-icon@latest --help
  ```
- Write a short release note pointing at the git tag.
- If a release is bad, `npm unpublish create-app-icon@0.2.1` works within 72 hours of publish; after that, `npm deprecate create-app-icon@0.2.1 "use 0.2.2 — <reason>"` is the right tool.

### Pre-launch checklist (before going wide, not needed for 0.x dogfood releases)

- Optionally set up a GitHub Actions workflow that runs `npm publish` on tag push, using an `NPM_TOKEN` secret.
- Confirm `create-app-icon` is still free on npm (`npm view create-app-icon`). If someone grabs it first, fall back to a scope like `@yourname/create-app-icon`.

## Self-hosting

The hosted service (`ai-app-icons.fly.dev` + `ai-app-icons.vercel.app`) gates AI usage behind Supabase login with a free tier of 5 calls/week and a $9.99/mo Pro tier. If you'd rather run everything yourself with your own OpenAI key, auth and billing are off by default when the relevant env vars are unset.

**Minimum setup (no auth, no billing):**

```bash
# api/.env
OPENAI_API_KEY=sk-...
# Leave SUPABASE_URL unset → auth is disabled, all endpoints are open.

# web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
# Leave NEXT_PUBLIC_SUPABASE_URL unset → middleware is a pass-through.
```

**CLI against your self-host:**

```bash
AI_APP_ICONS_API_URL=http://localhost:8000 npx create-app-icon
# or
npx create-app-icon --api-url http://localhost:8000
```

The CLI probes `GET /config` before running. When the server reports `{ "auth_required": false }`, it uses the terminal flow (no browser). When it reports `{ "auth_required": true }`, it automatically opens the browser wizard — login happens there via Supabase. The CLI itself stores no credentials.

**To run the hosted version yourself** (auth + billing enabled), set these env vars. Full reference in api/.env.example and web/.env.example.

| Service | Required env vars |
| --- | --- |
| api/ | `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET` |
| web/ | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_WEBHOOK_SECRET` |

Run the SQL files under supabase/migrations/ in order against your Supabase project to set up the `profiles` and `usage_events` tables.

## Inspiration

- [expo-icon-generator](https://github.com/WebNaresh/expo-icon-generator)
- [Expo splash screen & app icon docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)

Read more on [my website](https://jonny-jackson.com/posts/ai-app-icons/).