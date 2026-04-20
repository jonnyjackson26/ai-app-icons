# AI App Icons

Generate mobile app icon assets using AI. Describe your icon in plain English, refine it through conversation, and export all the sizes you need for Expo/React Native.

Available as an **`npx` command for Expo projects**, a **terminal CLI**, a **Python library**, a **REST API**, and a **web app**.

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
git clone https://github.com/Jonathan/ai-app-icons.git
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

| Method | Endpoint       | Description                                                    |
| ------ | -------------- | -------------------------------------------------------------- |
| POST   | `/generate`    | Generate icon from a text description (optional `mode` field)  |
| POST   | `/edit`        | Edit an existing icon with an instruction                      |
| POST   | `/assets`      | Generate all 5 asset sizes from an icon                        |
| GET    | `/backgrounds` | List available background types                                |
| GET    | `/health`      | Health check                                                   |

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

| id                 | Style            | Vibe                                                     |
| ------------------ | ---------------- | -------------------------------------------------------- |
| `flat` *(default)* | Flat             | Bold geometric shapes, solid colors, no shadows.         |
| `ios-liquid-glass` | iOS Liquid Glass | Glossy translucent material with soft refraction.        |
| `skeuomorphic`     | Skeuomorphic     | Realistic textures, lighting, and materials.             |
| `minimal`          | Minimal          | Single clean symbol, monochrome, lots of whitespace.     |
| `illustrative`     | Illustrative     | Warm hand-drawn look with organic shapes.                |
| `3d`               | 3D               | Rendered 3D object with soft lighting and depth.         |

Mode definitions live in two places:

- [`api/src/ai_app_icons/modes.py`](api/src/ai_app_icons/modes.py) — **source of truth**, including the style prompt text that gets injected into the icon-generation prompt.
- [`web/src/lib/generationModes.ts`](web/src/lib/generationModes.ts) — display metadata only (id, name, description) for the web UI, following the same pattern as `backgroundPresets.ts`.

If you add, rename, or remove a mode, update **both** files. The id strings must match exactly.

## Generated assets

| File                | Size      | Background  | Use                      |
| ------------------- | --------- | ----------- | ------------------------ |
| `splash.png`        | 1284x2778 | Configured  | Expo splash screen       |
| `icon.png`          | 1024x1024 | Configured  | App store icon           |
| `adaptive-icon.png` | 1024x1024 | Configured  | Android adaptive icon    |
| `splash-icon.png`   | 1024x1024 | Transparent | Expo splash icon (no bg) |
| `favicon.png`       | 48x48     | Transparent | Web favicon              |

## Background types

- **Solid color**: `{"type": "solid", "color": "#1a1a2e"}`
- **Gradient**: `{"type": "gradient", "colors": ["#0f0c29", "#302b63"], "direction": "to-bottom"}`
- **Image**: `{"type": "image", "path": "background.png"}`

## Deployment

See [docs/deployment.md](docs/deployment.md) — API on Fly.io, web app on Vercel.

## Publishing `create-app-icon` to npm

The `create-app-icon` package is what `npx create-app-icon` pulls from the npm registry. To cut a release:

```bash
cd create-app-icon

# 1. Sanity-check the name is still available (404 = free, 200 = taken).
npm view create-app-icon

# 2. Log in to npm (one-time per machine).
npm login

# 3. Bump the version. Uses semver: patch | minor | major.
#    This also creates a git tag like `v0.1.1`.
npm version patch

# 4. Clean build — publishing ships whatever's in dist/.
npm run build

# 5. Dry run to see exactly what will be uploaded.
npm publish --dry-run

# 6. Publish for real. First release needs --access public if the name ends up
#    scoped (e.g. @jonny/create-app-icon).
npm publish
```

**Pre-launch checklist before going wide:**

- The hosted API has **no auth and no rate limiting** today. Every `npx create-app-icon` invocation hits `https://ai-app-icons.fly.dev` and spends your OpenAI credits. Before publicizing, add a per-IP limiter (e.g. `slowapi`) or a shared-token gate to `POST /generate` and `POST /assets`.
- Optionally set up a GitHub Actions workflow that runs `npm publish` on tag push, using an `NPM_TOKEN` secret.
- Test the published package end-to-end: `cd /tmp && npx create-app-icon@latest` inside a scratch Expo project to confirm the registry copy works (not just the local build).

## Inspiration

- [expo-icon-generator](https://github.com/WebNaresh/expo-icon-generator)
- [Expo splash screen & app icon docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)

Read more on [my website](https://jonny-jackson.com/posts/ai-app-icons/).
