# Deployment

Two separate deployments: the API on Fly.io, the web app on Vercel.

## API on Fly.io

### Setup

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

### Launch

From the `api/` directory:

```bash
cd api
fly launch
```

### Set secrets

```bash
fly secrets set OPENAI_API_KEY=sk-your-key-here
fly secrets set ALLOWED_ORIGINS=https://your-web-app.vercel.app
```

Multiple origins: separate with commas.

### Deploy

```bash
cd api
fly deploy
```

Your API is live at `https://ai-app-icons.fly.dev`.

### CI/CD

Automatic deploys are configured in `.github/workflows/fly-deploy.yml` — deploys on push to `main`.

To set it up, add a `FLY_API_TOKEN` secret to your GitHub repository:

1. Create a deploy token:

   ```bash
   fly tokens create deploy -a ai-app-icons
   ```

2. In your GitHub repo, go to **Settings → Secrets and variables → Actions → New repository secret**.
3. Name: `FLY_API_TOKEN`, Value: the token from step 1.

### Verify

```bash
curl https://ai-app-icons.fly.dev/health
# Interactive docs: https://ai-app-icons.fly.dev/docs
# OpenAPI spec: https://ai-app-icons.fly.dev/openapi.json
```

## Web app on Vercel

Connect the repo to Vercel with these settings:

- **Root directory**: `web`
- **Framework**: Next.js (auto-detected)
- **Environment variable**: `NEXT_PUBLIC_API_URL` = `https://ai-app-icons.fly.dev`

Your site will be live at `https://your-app.vercel.app`.

## ChatGPT custom GPT integration

1. Deploy the API (above)
2. Add ChatGPT's domain to allowed origins:
   ```bash
   fly secrets set ALLOWED_ORIGINS=https://your-web-app.vercel.app,https://chat.openai.com
   ```
3. In the [GPT builder](https://chat.openai.com/gpts/editor): Configure > Actions > Create new action > Import from URL > paste `https://ai-app-icons.fly.dev/openapi.json`

## Local development

```bash
# Terminal 1 — API
cd api
pip install -e ".[api]"
uvicorn ai_app_icons.api.main:app --reload
# Runs at http://localhost:8000, CORS allows localhost:3000

# Terminal 2 — web app
cd web
npm install
npm run dev
# Runs at http://localhost:3000
```
