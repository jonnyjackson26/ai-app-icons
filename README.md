# AI App Icons

Generate mobile app icon assets using AI. Describe your icon in plain English, refine it through conversation, and export all the sizes you need for Expo/React Native.

Available as a **CLI**, a **Python library**, a **REST API**, and a **web app**.

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

### CLI

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

## Inspiration

- [expo-icon-generator](https://github.com/WebNaresh/expo-icon-generator)
- [Expo splash screen & app icon docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)

Read more on [my website](https://jonny-jackson.com/posts/ai-app-icons/).
