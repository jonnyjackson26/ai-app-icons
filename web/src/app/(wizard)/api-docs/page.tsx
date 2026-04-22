import type { Metadata } from "next";
import ContentPageShell from "@/components/ContentPageShell";

export const metadata: Metadata = {
  title: "API Docs — AI App Icons",
  description:
    "REST API for generating and editing mobile app icons. Endpoints, auth, request/response shapes, examples, and how to self-host.",
};

export default function ApiDocsPage() {
  return (
    <ContentPageShell>
      <h1>API Docs</h1>
      <p>
        AI App Icons is a FastAPI service. Everything the web wizard and the
        <code>create-app-icon</code> CLI do is exposed over HTTP — generate
        from a prompt, edit with an instruction, and export the full Expo
        asset set. The base URL for the hosted service is{" "}
        <code>https://ai-app-icons.fly.dev</code>.
      </p>
      <p>
        Interactive Swagger UI lives at{" "}
        <a href="https://ai-app-icons.fly.dev/docs">/docs</a>, and the raw
        OpenAPI spec is at{" "}
        <a href="https://ai-app-icons.fly.dev/openapi.json">/openapi.json</a>.
      </p>

      <h2>Authentication</h2>
      <p>
        <code>/generate</code>, <code>/edit</code>, and <code>/assets</code>
        {" "}require a Supabase JWT as a bearer token:
      </p>
      <ul>
        <li><code>Authorization: Bearer &lt;supabase-access-token&gt;</code></li>
      </ul>
      <p>
        There is no separate API-key scheme. The hosted service gates usage
        behind the same Supabase login the web app uses. If you need
        programmatic access, sign in through the web app, pull the
        {" "}<code>access_token</code> out of the Supabase session, and send
        it as the bearer. If you want to skip auth entirely and avoid the
        quota, self-host (see below).
      </p>

      <h2>Rate limits</h2>
      <p>
        Quota is counted as successful <code>/generate</code> +{" "}
        <code>/edit</code> calls in a rolling 7-day window.{" "}
        <code>/assets</code> does not hit OpenAI and does not consume quota.
      </p>
      <ul>
        <li><strong>Free</strong> — 5 calls per week.</li>
        <li><strong>Pro</strong> ($9.99/mo) — 100 calls per week.</li>
        <li><strong>Self-host</strong> — no cap.</li>
      </ul>
      <p>
        When you exceed the cap, the API returns HTTP <code>429</code> with
        a JSON body like{" "}
        <code>{`{"detail":{"code":"quota_exceeded","limit":100,"used":100,"window_days":7,"tier":"pro"}}`}</code>.
      </p>

      <h2>Endpoints</h2>

      <h3>GET /health</h3>
      <p>Liveness check. No auth.</p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{`$ curl https://ai-app-icons.fly.dev/health
{"status":"ok","version":"0.1.0"}`}</code></pre>

      <h3>GET /config</h3>
      <p>
        Public server config. The CLI calls this on startup to decide
        whether to prompt for login. No auth.
      </p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{`$ curl https://ai-app-icons.fly.dev/config
{"auth_required":true}`}</code></pre>

      <h3>GET /modes</h3>
      <p>Lists available style modes for generation. No auth.</p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{`$ curl https://ai-app-icons.fly.dev/modes
[
  {"id":"flat","name":"Flat","description":"Bold geometric shapes, solid colors, no shadows.","is_default":true},
  {"id":"ios-liquid-glass","name":"iOS Liquid Glass","description":"Glossy translucent material with soft refraction.","is_default":false},
  {"id":"single-color","name":"Single Color","description":"One-color silhouette on transparent background.","is_default":false},
  {"id":"3d","name":"3D","description":"Rendered 3D object with soft lighting and depth.","is_default":false}
]`}</code></pre>

      <h3>GET /backgrounds</h3>
      <p>
        Lists background types accepted by <code>/assets</code>. No auth.
        Over the HTTP API, <code>solid</code> and <code>gradient</code> are
        the practical options — <code>image</code> references a local file
        path and is only useful when running the generator in-process.
      </p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{`$ curl https://ai-app-icons.fly.dev/backgrounds
[
  {"type":"solid","description":"Single solid hex color","required_fields":["color"],"optional_fields":[]},
  {"type":"gradient","description":"Linear gradient with 2+ color stops","required_fields":["colors"],"optional_fields":["direction"]},
  {"type":"image","description":"External image file, scaled to cover","required_fields":["path"],"optional_fields":[]}
]`}</code></pre>

      <h3>POST /generate</h3>
      <p>Generate a new icon from a text description. Auth required. Consumes 1 quota call.</p>
      <p>Request body:</p>
      <ul>
        <li><code>description</code> (string, required) — plain-language description of the icon.</li>
        <li><code>size</code> (string, default <code>1024x1024</code>) — output dimensions.</li>
        <li><code>mode</code> (string, optional) — one of <code>flat</code>, <code>ios-liquid-glass</code>, <code>single-color</code>, <code>3d</code>. Defaults to <code>flat</code>.</li>
      </ul>
      <p>Response: <code>{`{ image_base64, message }`}</code> — a base64-encoded PNG with transparent background.</p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{`curl -X POST https://ai-app-icons.fly.dev/generate \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "A friendly robot mascot for a coding education app",
    "mode": "flat"
  }'

# → {"image_base64":"iVBORw0KGgoAAAANSUhEUgAA...","message":""}`}</code></pre>

      <h3>POST /edit</h3>
      <p>Refine an existing icon with a text instruction. Auth required. Consumes 1 quota call.</p>
      <p>Request body:</p>
      <ul>
        <li><code>image_base64</code> (string, required) — the current icon as base64 PNG.</li>
        <li><code>instruction</code> (string, required) — what to change.</li>
        <li><code>size</code> (string, default <code>1024x1024</code>).</li>
      </ul>
      <p>Response: <code>{`{ image_base64, message }`}</code>. <code>message</code> may carry commentary the model returned alongside the edit.</p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{`curl -X POST https://ai-app-icons.fly.dev/edit \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"image_base64\\": \\"$(base64 -w0 icon.png)\\",
    \\"instruction\\": \\"Make the colors warmer and add a subtle shadow\\"
  }"

# → {"image_base64":"iVBORw0KGgoAAAANSUhEUgAA...","message":""}`}</code></pre>

      <h3>POST /assets</h3>
      <p>
        Expand a single icon into the full Expo-compatible asset set — iOS
        light/dark/tinted, Android adaptive foreground/background/monochrome,
        splash, and favicon. Auth required. Does not consume quota (no
        OpenAI call).
      </p>
      <p>Request body:</p>
      <ul>
        <li><code>image_base64</code> (string, required) — the source icon as base64 PNG.</li>
        <li>
          <code>background</code> (object, required) — either:
          <ul>
            <li><code>{`{ "type": "solid", "color": "#1a1a2e" }`}</code></li>
            <li><code>{`{ "type": "gradient", "colors": ["#6366f1", "#ec4899"], "direction": "to-bottom-right" }`}</code></li>
          </ul>
        </li>
        <li>
          <code>ios_single_color_style</code> (string, default <code>masked</code>)
          — how to render the iOS dark variant for single-color logos.{" "}
          <code>masked</code> lets the brand gradient show through the
          silhouette; <code>solid</code> places the logo directly on the iOS
          dark canvas. Ignored for multi-color logos.
        </li>
      </ul>
      <p>
        Response: <code>assets</code> (array of{" "}
        <code>{`{ name, width, height, has_background, platform, variant, image_base64 }`}</code>),{" "}
        <code>background_color</code> (resolved hex for Android{" "}
        <code>adaptiveIcon.backgroundColor</code>), and <code>expo_config</code>
        {" "}— a drop-in <code>app.json</code> snippet wired to the returned
        filenames.
      </p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{`curl -X POST https://ai-app-icons.fly.dev/assets \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"image_base64\\": \\"$(base64 -w0 icon.png)\\",
    \\"background\\": {
      \\"type\\": \\"gradient\\",
      \\"colors\\": [\\"#6366f1\\", \\"#ec4899\\"],
      \\"direction\\": \\"to-bottom-right\\"
    }
  }"

# → {
#     "assets": [
#       {"name":"icon.png","width":1024,"height":1024,"has_background":true,"platform":"general","variant":"standard","image_base64":"..."},
#       {"name":"icon-ios.png", ...},
#       {"name":"icon-ios-dark.png", ...},
#       {"name":"icon-ios-tinted.png", ...},
#       {"name":"adaptive-foreground.png", ...},
#       {"name":"adaptive-background.png", ...},
#       {"name":"adaptive-monochrome.png", ...},
#       {"name":"splash.png", ...},
#       {"name":"splash-icon.png", ...},
#       {"name":"favicon.png", ...}
#     ],
#     "background_color": "#6366f1",
#     "expo_config": { "expo": { "icon": "./assets/icon.png", "ios": { ... }, "android": { ... } } }
#   }`}</code></pre>

      <h2>Errors</h2>
      <ul>
        <li><strong>400</strong> — invalid input (bad base64, unknown mode, content-policy rejection).</li>
        <li><strong>401</strong> — missing or invalid bearer token.</li>
        <li><strong>429</strong> — quota exceeded (body includes <code>code: &quot;quota_exceeded&quot;</code>) or upstream OpenAI rate limit.</li>
        <li><strong>500</strong> — unexpected server error.</li>
        <li><strong>503</strong> — upstream OpenAI service is unavailable, misconfigured, or at its billing limit.</li>
      </ul>

      <h2>Self-hosting (no auth, no quota)</h2>
      <p>
        The simplest way to use the API programmatically is to run it
        yourself. When <code>SUPABASE_URL</code> is unset, the server
        treats every caller as an unlimited &ldquo;self-host&rdquo; user
        and skips JWT verification entirely. All you need is an{" "}
        <code>OPENAI_API_KEY</code>:
      </p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto"><code>{`cd api
pip install -e ".[api]"
OPENAI_API_KEY=sk-... uvicorn ai_app_icons.api.main:app --port 8000`}</code></pre>
      <p>
        Then hit <code>http://localhost:8000/generate</code> without any
        <code>Authorization</code> header. See{" "}
        <a href="https://github.com/jonathannen/ai-app-icons/blob/main/docs/self-hosting.md">
          docs/self-hosting.md
        </a>{" "}
        for the full walkthrough, including pointing the CLI and web app at
        your own instance.
      </p>

      <h2>Start with the interactive docs</h2>
      <p>
        The fastest way to explore the API is the live Swagger UI at{" "}
        <a href="https://ai-app-icons.fly.dev/docs">
          ai-app-icons.fly.dev/docs
        </a>
        . Paste your bearer token once and you can fire real requests
        against every endpoint from the browser.
      </p>
    </ContentPageShell>
  );
}
