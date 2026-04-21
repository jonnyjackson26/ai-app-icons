import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

export interface LoopbackHandle<T> {
  server: Server;
  port: number;
  token: string;
  payloadPromise: Promise<T>;
  close: () => void;
}

export interface StartLoopbackOpts<T> {
  expectedOrigin: string;
  validate: (body: unknown) => T;
}

/**
 * Spin up a 127.0.0.1 loopback server to receive a one-shot POST from the
 * web app. Used by both the wizard handoff (assets) and the login flow
 * (CLI API key).
 */
export function startLoopbackServer<T>(
  opts: StartLoopbackOpts<T>,
): Promise<LoopbackHandle<T>> {
  const token = randomBytes(32).toString("hex");

  return new Promise((resolveStart, rejectStart) => {
    let resolvePayload!: (v: T) => void;
    let rejectPayload!: (err: Error) => void;
    const payloadPromise = new Promise<T>((res, rej) => {
      resolvePayload = res;
      rejectPayload = rej;
    });

    const server = createServer((req, res) => {
      handleRequest(req, res, { token, ...opts }, resolvePayload, rejectPayload);
    });

    server.on("error", (err) => rejectStart(err));
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        rejectStart(new Error("Unexpected server address"));
        return;
      }
      resolveStart({
        server,
        port: addr.port,
        token,
        payloadPromise,
        close: () => server.close(),
      });
    });
  });
}

function handleRequest<T>(
  req: IncomingMessage,
  res: ServerResponse,
  opts: { token: string; expectedOrigin: string; validate: (body: unknown) => T },
  resolvePayload: (v: T) => void,
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
        const payload = opts.validate(body);
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
