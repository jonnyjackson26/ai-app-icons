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

| Method | Endpoint       | Description                               |
| ------ | -------------- | ----------------------------------------- |
| POST   | `/generate`    | Generate icon from a text description     |
| POST   | `/edit`        | Edit an existing icon with an instruction |
| POST   | `/assets`      | Generate all 5 asset sizes from an icon   |
| GET    | `/backgrounds` | List available background types           |
| GET    | `/health`      | Health check                              |

### Python library

```bash
cd api && pip install -e .
```

```python
from ai_app_icons import generate_icon, edit_icon, generate_all_assets
from pathlib import Path

icon = generate_icon("A friendly robot for a coding app")
edited, message = edit_icon(icon, "Make the colors warmer")
generate_all_assets(edited, {"type": "auto"}, Path("output"))
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

## Generated assets

| File                | Size      | Background  | Use                      |
| ------------------- | --------- | ----------- | ------------------------ |
| `splash.png`        | 1284x2778 | Configured  | Expo splash screen       |
| `icon.png`          | 1024x1024 | Configured  | App store icon           |
| `adaptive-icon.png` | 1024x1024 | Configured  | Android adaptive icon    |
| `splash-icon.png`   | 1024x1024 | Transparent | Expo splash icon (no bg) |
| `favicon.png`       | 48x48     | Transparent | Web favicon              |

## Background types

- **Auto gradient** (default): extracts dominant colors from your icon — `{"type": "auto"}`
- **Solid color**: `{"type": "solid", "color": "#1a1a2e"}`
- **Gradient**: `{"type": "gradient", "colors": ["#0f0c29", "#302b63"], "direction": "to-bottom"}`
- **Image**: `{"type": "image", "path": "background.png"}`

## Deployment

See [docs/deployment.md](docs/deployment.md) — API on Fly.io, web app on Vercel.

## Inspiration

- [expo-icon-generator](https://github.com/WebNaresh/expo-icon-generator)
- [Expo splash screen & app icon docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)

Read more on [my website](https://jonny-jackson.com/posts/ai-app-icons/).
