# Self-hosting

Run ai-app-icons on your own infrastructure with your own OpenAI key. Auth and billing stay off unless you opt in, so the minimal path is short.

## Minimal setup (no auth, no billing)

You need:

- Python 3.11+
- Node 20+
- An OpenAI API key

```bash
git clone https://github.com/jonnyjackson26/ai-app-icons.git
cd ai-app-icons

# api
cd api
cp .env.example .env
# edit .env: set OPENAI_API_KEY=sk-...
pip install -e ".[api]"
uvicorn ai_app_icons.api.main:app --reload --port 8000

# web (new terminal)
cd ../web
cp .env.example .env.local
# edit .env.local: set NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

Visit <http://localhost:3000>. No login required, no usage cap — the API uses your `OPENAI_API_KEY` directly.

## Using the CLI against your self-host

```bash
AI_APP_ICONS_API_URL=http://localhost:8000 npx create-app-icon
# or
npx create-app-icon --api-url http://localhost:8000
```

The CLI probes `GET /config`. When the server reports `{"auth_required": false}`, the CLI skips the browser wizard and uses its built-in terminal prompts.

## Optional: enable auth + billing

Useful if you're running a public instance.

### Supabase

1. Create a project at <https://supabase.com>.
2. Run [supabase/migrations/0001_auth_and_billing.sql](../supabase/migrations/0001_auth_and_billing.sql) and [0002_drop_cli_api_keys.sql](../supabase/migrations/0002_drop_cli_api_keys.sql) in the SQL editor.
3. Enable providers under **Authentication → Providers** (email + any OAuth you want; see Google setup below).
4. Under **Authentication → URL Configuration**, set **Site URL** to your web domain and add your domain + `/auth/callback` and `/**` to **Redirect URLs** (keep `localhost:3000/**` if you still develop against it).
5. Email template (optional): if you prefer 6-digit codes over magic links, edit the Magic Link template to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.

### Google OAuth (optional)

1. Google Cloud Console → **APIs & Services → OAuth consent screen** → create.
2. **Credentials → OAuth client ID → Web application**. Authorized redirect URI:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
3. Paste **Client ID** + **Client Secret** into Supabase → **Authentication → Providers → Google**.

### Stripe (required only if you want paid tiers)

1. Dashboard → create a product + monthly price. Copy the `price_...` ID.
2. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-web-domain>/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Reveal the signing secret (`whsec_...`).
3. **Settings → Billing → Customer portal** — configure what users can do (cancel, plan change, invoice history).

For local testing: `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe` prints a dev `whsec_` each time. Restart = new secret.

### Env vars

API ([api/.env](../api/.env.example)):

```
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=https://your-web-domain
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_JWT_SECRET=...                # from Supabase → Project Settings → API → JWT Settings
```

Web ([web/.env.local](../web/.env.example)):

```
NEXT_PUBLIC_API_URL=https://your-api-domain
NEXT_PUBLIC_SITE_URL=https://your-web-domain

NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_PRO=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Leave any of the Supabase/Stripe blocks blank to keep that feature off. The code path short-circuits when the relevant env var is missing.

## Deploying

See [deployment.md](./deployment.md) for Fly (API) and Vercel (web) details. The only self-host-specific step is setting the env vars above via `fly secrets set ...` and Vercel → Settings → Environment Variables.

## Tier caps

Defined in [api/src/ai_app_icons/api/quota.py](../api/src/ai_app_icons/api/quota.py):

| Tier      | Rolling 7-day cap |
|-----------|-------------------|
| free      | 5                 |
| pro       | 100               |
| unlimited | no cap            |

`unlimited` is also the implicit tier for self-host (when `SUPABASE_URL` is unset). Change the numbers in `TIER_LIMITS` and redeploy — or fork and re-tune to taste.
