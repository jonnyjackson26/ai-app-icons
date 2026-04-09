# Deployment

We will have two seperate deployments:
The API on fly.io and the web app on vercel.

## API on fly

1. Install the Fly CLI:

   ```bash
   # macOS
   brew install flyctl

   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

   # Linux
   curl -L https://fly.io/install.sh | sh
   ```

add to path `$env:PATH += ";C:\Users\Jonathan\.fly\bin"`

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

### Environment variable in your frontend code

Whatever framework you use, reference the API URL from an environment variable so it works in both local development and production:

```javascript
// Vite (React, Vue, Svelte)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Next.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

Then call the API:

```javascript
const response = await fetch(`${API_URL}/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ description: "A friendly robot mascot" }),
});
const { image_base64 } = await response.json();
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
