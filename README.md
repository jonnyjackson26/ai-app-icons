# AI App Icons

Generate mobile app icon assets using AI. Describe your icon in plain English, refine it through conversation, and export all the sizes you need for Expo/React Native.

Available as a **CLI**, a **Python library**, and a **REST API**.

## Quick start

```bash
git clone https://github.com/Jonathan/ai-app-icons.git
cd ai-app-icons
pip install -e ".[cli]"
```

Create a `.env` file with your OpenAI key:

```
OPENAI_API_KEY=sk-...
```

Run the interactive CLI:

```bash
ai-app-icons
```

---

## How installation works

This project is a standard Python package. The `pyproject.toml` file at the root defines the package name, its dependencies, and how to build it.

### `pip install -e .` — what does `-e` mean?

When you run `pip install .` (without `-e`), pip copies the package into your Python environment. If you then edit the source code, nothing changes — you'd have to reinstall.

`pip install -e .` installs in **editable mode** (the `-e` stands for "editable"). Instead of copying, it creates a link from your Python environment back to your source code. That means:

- Any changes you make to files in `src/ai_app_icons/` take effect immediately
- No need to reinstall after every edit
- This is what you want during development

If you're just using the tool (not developing it), plain `pip install .` is fine too.

### `".[cli]"` — what are the brackets?

The `.` means "install the package from the current directory." The `[cli]` part installs **optional extras** — additional dependencies that aren't required by the core library but are needed for specific features.

This project defines three extras in `pyproject.toml`:

| Command | What it installs | When you need it |
|---|---|---|
| `pip install .` | Core only (Pillow, openai, python-dotenv) | Using as a Python library |
| `pip install ".[cli]"` | Core + `rich` | Running the interactive CLI |
| `pip install ".[api]"` | Core + `fastapi`, `uvicorn` | Running the REST API server |
| `pip install ".[cli,api]"` | Core + both | Running everything |
| `pip install ".[dev]"` | Core + `pytest`, `httpx` | Running tests |
| `pip install -e ".[cli,api,dev]"` | Everything, editable | Full development setup |

The quotes around `".[cli]"` are needed because square brackets have special meaning in most shells. Without quotes, your shell might try to interpret `[cli]` as a glob pattern instead of passing it to pip.

### Why extras instead of one big `requirements.txt`?

Someone who only wants to use this as a Python library (`from ai_app_icons import generate_icon`) shouldn't need to install `rich` or `fastapi`. Extras keep the core lightweight and let each surface pull in only what it needs.

The old `requirements.txt` still exists for reference, but `pyproject.toml` is the source of truth now.

---

## Project structure

```
ai-app-icons/
  pyproject.toml              # package config — name, version, deps, extras
  chatbot.py                  # backward-compat entry point (python chatbot.py still works)
  src/
    ai_app_icons/             # the Python package
      __init__.py             # public API: generate_icon, edit_icon, etc.
      icon_gen.py             # AI icon generation (OpenAI API calls)
      assets.py               # generate all 5 asset sizes with backgrounds
      session.py              # session state dataclass
      background/             # background generators (auto, solid, gradient, image)
      cli/                    # interactive terminal UI (requires `rich`)
      api/                    # REST API (requires `fastapi`)
  web/                        # Next.js web app (separate from the Python package)
    src/
      app/                    # Next.js App Router (layout, page)
      components/             # Wizard, steps, UI components
      lib/                    # API client, types, download helpers
  docs/
    deployment.md             # how to deploy the API and web app
```

Everything under `src/ai_app_icons/` is the Python package. The `src/` layout is a Python packaging convention — it prevents confusing import bugs during development.

The `web/` directory is a standalone Next.js app with its own `package.json`. It connects to the Python API over HTTP — the two are deployed separately.

---

## Usage

### As a CLI

```bash
pip install -e ".[cli]"
ai-app-icons
```

This launches an interactive conversation. You describe an icon, the AI generates it, you can refine it, pick a background, and export all asset sizes.

You can also run it the old way:

```bash
python chatbot.py
```

### As a Python library

```bash
pip install -e .
```

```python
from ai_app_icons import generate_icon, edit_icon, generate_all_assets
from pathlib import Path

# Generate an icon
icon = generate_icon("A friendly robot for a coding app")

# Refine it
edited, message = edit_icon(icon, "Make the colors warmer")

# Export all asset sizes with auto background
generate_all_assets(edited, {"type": "auto"}, Path("output"))
```

### As a REST API

```bash
pip install -e ".[api]"
uvicorn ai_app_icons.api.main:app --reload
```

This starts a FastAPI server at `http://localhost:8000`.

Open `http://localhost:8000/docs` for **Swagger UI** — an interactive page where you can try every endpoint directly in your browser. The root URL (`/`) redirects there too.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/docs` | Swagger UI — interactive API explorer |
| POST | `/generate` | Generate icon from a text description |
| POST | `/edit` | Edit an existing icon with an instruction |
| POST | `/assets` | Generate all 5 asset sizes from an icon |
| GET | `/backgrounds` | List available background types |
| GET | `/health` | Health check |

All image data is transferred as base64-encoded PNGs in JSON.

#### ChatGPT custom GPT integration

FastAPI auto-generates an OpenAPI spec at `/openapi.json`. When creating a custom GPT:

1. Deploy the API to a public URL
2. In the GPT builder, go to "Actions" and paste your `/openapi.json` URL
3. ChatGPT reads the spec and learns how to call your endpoints

### As a web app

The web app is a Next.js frontend that talks to the API. You need both running:

```bash
# Terminal 1 — start the API
pip install -e ".[api]"
uvicorn ai_app_icons.api.main:app --reload

# Terminal 2 — start the web app
cd web
npm install
npm run dev
```

Open `http://localhost:3000`. The web app connects to the API at `http://localhost:8000` by default (configured in `web/.env.local`).

The web app walks you through the same flow as the CLI:

1. **Describe** your icon or upload an existing image
2. **Review** the generated icon
3. **Refine** it with follow-up instructions (optional, can loop)
4. **Choose a background** — auto gradient, solid color, or custom gradient
5. **Export** all 5 asset sizes — download individually or as a .zip

To point the web app at a different API (e.g., a deployed one):

```bash
# web/.env.local
NEXT_PUBLIC_API_URL=https://your-api.fly.dev
```

For deployment, see [docs/deployment.md](docs/deployment.md) — the API goes on fly.io, the web app goes on Vercel or Cloudflare Pages (free).

### Generated assets

| File | Size | Background | Use |
|---|---|---|---|
| `splash.png` | 1284x2778 | Configured | Expo splash screen |
| `icon.png` | 1024x1024 | Configured | App store icon |
| `adaptive-icon.png` | 1024x1024 | Configured | Android adaptive icon |
| `splash-icon.png` | 1024x1024 | Transparent | Expo splash icon (no bg) |
| `favicon.png` | 48x48 | Transparent | Web favicon |

---

## Background types

### Auto gradient (default)

Extracts dominant colors from your icon and generates a complementary gradient.

```python
{"type": "auto"}
{"type": "auto", "direction": "to-bottom"}
```

### Solid color

```python
{"type": "solid", "color": "#1a1a2e"}
```

### Gradient

Linear gradient with 2+ colors.

```python
{"type": "gradient", "colors": ["#0f0c29", "#302b63", "#24243e"], "direction": "to-bottom"}
```

#### Named directions

| Direction | Angle | Description |
|---|---|---|
| `to-right` | 0 | Left to right |
| `to-top-right` | 45 | Bottom-left to top-right |
| `to-top` | 90 | Bottom to top |
| `to-top-left` | 135 | Bottom-right to top-left |
| `to-left` | 180 | Right to left |
| `to-bottom-left` | 225 | Top-right to bottom-left |
| `to-bottom` | 270 | Top to bottom |
| `to-bottom-right` | 315 | Top-left to bottom-right |

You can also pass a numeric angle (e.g., `45`).

### Background image

```python
{"type": "image", "path": "background.png"}
```

---

## Inspiration

- [expo-icon-generator](https://github.com/WebNaresh/expo-icon-generator)
- [expo-icon-builder](https://expo-icon-builder.com/?emoji=hugging_face)
- [Expo splash screen & app icon docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Figma: Expo App Icon / Splash v2](https://www.figma.com/design/xwU1GutPcyGj0X5Q5Eitau/Expo-App-Icon---Splash-v2--Community---Community-?node-id=1-3040&t=JvL2pzQG06cKUhpj-0)
- https://developer.apple.com/design/human-interface-guidelines/app-icons
