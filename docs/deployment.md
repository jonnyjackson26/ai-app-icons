# Deployment

The recommended setup is two separate deployments:

| Component | Hosted on | Why |
|---|---|---|
| **API** | [fly.io](https://fly.io) | Needs a real server (handles OpenAI API calls, image processing) |
| **Web app** | [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com) | Free static hosting with a global CDN |

The API is the only part that costs money to host. The web app is just HTML/CSS/JS that calls the API — static hosting is free on Vercel and Cloudflare Pages.

---

## Part 1: Deploy the API on fly.io

### What is fly.io?

Fly.io runs your app in lightweight VMs close to your users. It has a free tier (3 shared VMs, 256 MB each) which is enough for this API.

### Prerequisites

1. Install the Fly CLI:

   ```bash
   # macOS
   brew install flyctl

   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

   # Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. Sign up / log in:

   ```bash
   fly auth signup    # first time
   fly auth login     # returning user
   ```

### Step 1: Create the Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install the package with API extras
COPY . .
RUN pip install --no-cache-dir ".[api]"

# Expose the port fly.io expects
EXPOSE 8080

# Run the API server
CMD ["uvicorn", "ai_app_icons.api.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 2: Launch on fly.io

From the project root:

```bash
fly launch
```

Fly will detect the Dockerfile and ask you a few questions:

- **App name**: pick something like `ai-app-icons-api`
- **Region**: pick the closest to you (or your users)
- **Database**: no
- **Deploy now?**: no (we need to set secrets first)

This creates a `fly.toml` file in your project.

### Step 3: Set your secrets

Your API needs the OpenAI key, and you should set the allowed origins for CORS so only your web app can call it:

```bash
fly secrets set OPENAI_API_KEY=sk-your-key-here
fly secrets set ALLOWED_ORIGINS=https://your-web-app.vercel.app
```

These are encrypted environment variables — they never appear in logs, code, or config files.

If you have multiple allowed origins (e.g., your production site + a preview URL), separate them with commas:

```bash
fly secrets set ALLOWED_ORIGINS=https://your-app.vercel.app,https://preview.your-app.vercel.app
```

### Step 4: Deploy

```bash
fly deploy
```

This builds the Docker image, pushes it to Fly, and starts your app. It takes a couple of minutes the first time.

When it's done, your API is live at:

```
https://ai-app-icons-api.fly.dev
```

### Step 5: Verify

```bash
# Health check
curl https://ai-app-icons-api.fly.dev/health

# Interactive API docs
# Open in browser: https://ai-app-icons-api.fly.dev/docs

# OpenAPI spec (for ChatGPT GPT integration)
# https://ai-app-icons-api.fly.dev/openapi.json
```

### Useful fly.io commands

```bash
fly status              # check if your app is running
fly logs                # stream live logs
fly secrets list        # see which secrets are set (not their values)
fly scale count 1       # run 1 instance (default)
fly scale memory 512    # bump RAM if you need it (for image processing)
fly deploy              # redeploy after code changes
```

### Cost

Fly.io's free tier includes 3 shared-cpu-1x VMs with 256 MB RAM. This API fits comfortably in one. You won't be charged unless you exceed the free tier or explicitly scale up.

---

## Part 2: Deploy the web app

The web app is a static frontend (HTML/CSS/JS or React) that calls your API. Static sites are free to host.

### Option A: Vercel

Vercel is the easiest option for React/Next.js apps.

1. Push your `web/` directory to GitHub (it can be in the same repo)

2. Go to [vercel.com](https://vercel.com), sign in with GitHub

3. Click "Import Project" and select your repo

4. Configure:
   - **Root directory**: `web`
   - **Framework**: auto-detected (React, Next.js, etc.)
   - **Environment variables**: add `VITE_API_URL` (or `NEXT_PUBLIC_API_URL`) set to your fly.io URL:
     ```
     VITE_API_URL=https://ai-app-icons-api.fly.dev
     ```

5. Click Deploy

Your site will be live at `https://your-app.vercel.app`. Vercel auto-deploys on every push to `main`.

### Option B: Cloudflare Pages

Cloudflare Pages is similar to Vercel with a generous free tier and great global performance.

1. Push your code to GitHub

2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Pages → Create a project

3. Connect your GitHub repo

4. Configure:
   - **Root directory (path)**: `web`
   - **Build command**: `npm run build` (or whatever your framework uses)
   - **Build output directory**: `dist` (Vite) or `build` (Create React App) or `.next` (Next.js)
   - **Environment variables**: add your API URL

5. Deploy

Your site will be live at `https://your-app.pages.dev`.

### Environment variable in your frontend code

Whatever framework you use, reference the API URL from an environment variable so it works in both local development and production:

```javascript
// Vite (React, Vue, Svelte)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Next.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

Then call the API:

```javascript
const response = await fetch(`${API_URL}/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ description: 'A friendly robot mascot' }),
})
const { image_base64 } = await response.json()
```

---

## Part 3: ChatGPT custom GPT integration

If you want a ChatGPT GPT to call your API:

1. Deploy the API on fly.io (Part 1 above)

2. Add ChatGPT's domain to your allowed origins:
   ```bash
   fly secrets set ALLOWED_ORIGINS=https://your-web-app.vercel.app,https://chat.openai.com
   ```

3. In the [GPT builder](https://chat.openai.com/gpts/editor):
   - Go to **Configure** → **Actions** → **Create new action**
   - Click **Import from URL**
   - Paste: `https://ai-app-icons-api.fly.dev/openapi.json`
   - ChatGPT reads the spec and auto-creates actions for each endpoint

4. Test by asking the GPT to generate an icon

---

## Local development

Run the API locally during development:

```bash
pip install -e ".[api]"
uvicorn ai_app_icons.api.main:app --reload
```

The `--reload` flag watches for file changes and restarts automatically. The API runs at `http://localhost:8000`.

CORS is pre-configured to allow `localhost:3000` and `localhost:5173` (default ports for React/Vite dev servers).

Run the web app locally (once you build it):

```bash
cd web
npm install
npm run dev
```

Both can run simultaneously — the frontend on port 3000/5173 calls the API on port 8000.
