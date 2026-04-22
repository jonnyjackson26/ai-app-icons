import type { Metadata } from "next";
import ContentPageShell from "@/components/ContentPageShell";

export const metadata: Metadata = {
  title: "API Docs — AI App Icons",
  description:
    "REST API for generating and editing mobile app icons. Endpoints, auth, request/response shapes, and how to self-host.",
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
        The spec is importable straight into a ChatGPT custom GPT as an
        Action.
      </p>

      <h2>Authentication</h2>
      <p>
        <code>/generate</code>, <code>/edit</code>, and <code>/assets</code>
        require a Supabase JWT as a bearer token:
      </p>
      <ul>
        <li><code>Authorization: Bearer &lt;supabase-access-token&gt;</code></li>
      </ul>
      <p>
        There is no separate API-key scheme. The hosted service gates usage
        behind the same Supabase login the web app uses: free tier is 5 calls
        per week, Pro ($9.99/mo) is unlimited. If you need programmatic
        access from your own app, sign in with Supabase, grab the
        <code>access_token</code> from the session, and send it as the
        bearer. If you want to bypass auth entirely, self-host (see below).
      </p>

      <h2>Endpoints</h2>

      <h3>GET /health</h3>
      <p>Liveness check. Returns <code>{`{ status, version }`}</code>. No auth.</p>

      <h3>GET /config</h3>
      <p>
        Public server config. Returns <code>{`{ auth_required: bool }`}</code>.
        The CLI calls this on startup to decide whether to prompt for login.
      </p>

      <h3>GET /modes</h3>
      <p>
        Lists available style modes for generation — id, name, description,
        and which one is the default. Current ids include <code>flat</code>,
        <code>ios-liquid-glass</code>, <code>single-color</code>, and{" "}
        <code>3d</code>.
      </p>

      <h3>GET /backgrounds</h3>
      <p>
        Lists the background types that <code>/assets</code> accepts —{" "}
        <code>solid</code>, <code>gradient</code>, and <code>image</code> —
        and which fields each one requires.
      </p>

      <h3>POST /generate</h3>
      <p>Generate a new icon from a text description.</p>
      <p>Request:</p>
      <ul>
        <li><code>description</code> (string, required) — plain-language description of the icon.</li>
        <li><code>size</code> (string, default <code>1024x1024</code>) — output dimensions.</li>
        <li><code>mode</code> (string, optional) — style mode id. Defaults to <code>flat</code>.</li>
      </ul>
      <p>
        Response: <code>{`{ image_base64, message }`}</code> — a base64-encoded
        PNG with a transparent background.
      </p>

      <h3>POST /edit</h3>
      <p>Refine an existing icon with a text instruction.</p>
      <p>Request:</p>
      <ul>
        <li><code>image_base64</code> (string, required) — the current icon as base64 PNG.</li>
        <li><code>instruction</code> (string, required) — what to change (e.g. &ldquo;make the colors warmer&rdquo;).</li>
        <li><code>size</code> (string, default <code>1024x1024</code>).</li>
      </ul>
      <p>
        Response: <code>{`{ image_base64, message }`}</code>. <code>message</code>
        may include any commentary the model returned alongside the edit.
      </p>

      <h3>POST /assets</h3>
      <p>
        Expand a single icon into the full Expo-compatible asset set — iOS
        light, dark, and tinted; Android adaptive foreground, background,
        and monochrome; web favicons.
      </p>
      <p>Request:</p>
      <ul>
        <li><code>image_base64</code> (string, required) — the source icon.</li>
        <li>
          <code>background</code> (object, required) — one of:
          <ul>
            <li><code>{`{ type: "solid", color: "#1a1a2e" }`}</code></li>
            <li><code>{`{ type: "gradient", colors: ["#...", "#..."], direction: "to-bottom-right" }`}</code></li>
            <li><code>{`{ type: "image", path: "..." }`}</code></li>
          </ul>
        </li>
        <li>
          <code>ios_single_color_style</code> (string, default <code>masked</code>)
          — how to render the iOS dark variant for single-color logos.{" "}
          <code>masked</code> lets a brand gradient show through the
          silhouette; <code>solid</code> places the logo directly on the iOS
          dark canvas. Ignored for multi-color logos.
        </li>
      </ul>
      <p>
        Response: <code>assets</code> (array of{" "}
        <code>{`{ name, width, height, has_background, platform, variant, image_base64 }`}</code>),{" "}
        <code>background_color</code> (resolved hex for Android
        <code>adaptiveIcon.backgroundColor</code>), and <code>expo_config</code>
        — a drop-in <code>app.json</code> snippet wired to the returned
        filenames.
      </p>

      <h2>Errors</h2>
      <ul>
        <li><strong>400</strong> — invalid input (bad base64, unknown mode, malformed background).</li>
        <li><strong>401</strong> — missing or invalid bearer token.</li>
        <li><strong>402</strong> — quota exceeded on the free tier.</li>
        <li><strong>500</strong> — upstream model error or unexpected failure.</li>
      </ul>
      <p>
        OpenAI API errors are forwarded with their original status code and
        message so you can tell a rate limit apart from a content-policy
        rejection.
      </p>

      <h2>Example: generate an icon with curl</h2>
      <p>
        Grab your Supabase access token from the web app&rsquo;s browser
        session, then:
      </p>
      <pre className="text-xs leading-5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{`curl -X POST https://ai-app-icons.fly.dev/generate \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"description":"A friendly robot mascot","mode":"flat"}'`}</code></pre>

      <h2>Self-hosting (no auth)</h2>
      <p>
        The easiest way to use the API programmatically without hitting
        quota is to run it yourself. When <code>SUPABASE_URL</code> is
        unset, the server treats every caller as an unlimited
        &ldquo;self-host&rdquo; user and skips JWT verification entirely.
        All you need is an <code>OPENAI_API_KEY</code>:
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

      <h2>Rate limits &amp; costs</h2>
      <p>
        The hosted service tracks OpenAI token and image usage per call in
        Supabase. Free tier resets weekly; Pro is unlimited but still
        subject to OpenAI&rsquo;s own rate limits on the account the server
        is configured with. Self-hosted: no limits beyond what your own
        OpenAI key allows.
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
