import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { platform } from "node:os";
import kleur from "kleur";
import type { AssetsResponse } from "./api.js";

export interface WebFlowArgs {
  webUrl: string;
  timeoutMs: number;
}

export async function runWebFlow(args: WebFlowArgs): Promise<AssetsResponse> {
  const token = randomBytes(32).toString("hex");
  const expectedOrigin = new URL(args.webUrl).origin;

  const { server, port, payloadPromise } = await startCallbackServer({
    token,
    expectedOrigin,
  });

  const browserUrl =
    `${args.webUrl}/?cli_callback=${encodeURIComponent(
      `http://127.0.0.1:${port}/result`,
    )}&cli_token=${token}`;

  const opened = openInBrowser(browserUrl);
  if (opened) {
    console.log(kleur.dim("Opened the wizard in your browser."));
  } else {
    console.log(kleur.yellow("Couldn't open your browser automatically."));
  }
  console.log(kleur.dim("If needed, paste this URL manually:"));
  console.log("  " + kleur.cyan(browserUrl));
  console.log(kleur.dim("Waiting for you to finish in the browser..."));

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            `Timed out after ${Math.round(
              args.timeoutMs / 1000,
            )}s waiting for the browser wizard. Try --web-timeout <seconds>.`,
          ),
        ),
      args.timeoutMs,
    ),
  );

  try {
    return await Promise.race([payloadPromise, timeout]);
  } finally {
    server.close();
  }
}

interface ServerHandle {
  server: Server;
  port: number;
  payloadPromise: Promise<AssetsResponse>;
}

function startCallbackServer(opts: {
  token: string;
  expectedOrigin: string;
}): Promise<ServerHandle> {
  return new Promise((resolveStart, rejectStart) => {
    let resolvePayload!: (v: AssetsResponse) => void;
    let rejectPayload!: (err: Error) => void;
    const payloadPromise = new Promise<AssetsResponse>((res, rej) => {
      resolvePayload = res;
      rejectPayload = rej;
    });

    const server = createServer((req, res) => {
      handleRequest(req, res, opts, resolvePayload, rejectPayload);
    });

    server.on("error", (err) => rejectStart(err));
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        rejectStart(new Error("Unexpected server address"));
        return;
      }
      resolveStart({ server, port: addr.port, payloadPromise });
    });
  });
}

function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  opts: { token: string; expectedOrigin: string },
  resolvePayload: (v: AssetsResponse) => void,
  rejectPayload: (err: Error) => void,
): void {
  const originHeader = req.headers.origin;
  const originOk =
    typeof originHeader === "string" && originHeader === opts.expectedOrigin;

  if (originOk) {
    res.setHeader("Access-Control-Allow-Origin", originHeader);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type, x-cli-token");
  }

  if (req.method === "OPTIONS" && req.url === "/result") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/result") {
    if (!tokenOk(req.headers["x-cli-token"], opts.token)) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: "bad token" }));
      return;
    }
    readJson(req)
      .then((body) => {
        const payload = body as AssetsResponse;
        if (!payload || !Array.isArray(payload.assets) || !payload.expo_config) {
          throw new Error("malformed payload");
        }
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: true }));
        resolvePayload(payload);
      })
      .catch((err: unknown) => {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: (err as Error).message }));
        rejectPayload(err instanceof Error ? err : new Error(String(err)));
      });
    return;
  }

  res.statusCode = 404;
  res.end();
}

function tokenOk(header: string | string[] | undefined, expected: string): boolean {
  const got = Array.isArray(header) ? header[0] : header;
  if (!got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : null);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function openInBrowser(url: string): boolean {
  try {
    const os = platform();
    if (os === "win32") {
      // `start` is a cmd builtin. cmd.exe treats `&` as a command separator,
      // which truncates URLs with query strings — escape each `&` as `^&` so
      // cmd passes the full URL through to the browser. The empty "" arg is
      // `start`'s window-title slot, required when the URL is quoted-looking.
      const safe = url.replace(/&/g, "^&");
      spawn("cmd", ["/c", "start", "", safe], {
        detached: true,
        stdio: "ignore",
        windowsVerbatimArguments: true,
      }).unref();
    } else if (os === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    }
    return true;
  } catch {
    return false;
  }
}
