import { spawn } from "node:child_process";
import { platform } from "node:os";
import { basename } from "node:path";
import kleur from "kleur";
import type { AssetsResponse } from "./api.js";
import { startLoopbackServer } from "./loopback.js";

export interface WebFlowArgs {
  webUrl: string;
  timeoutMs: number;
}

function validateAssets(body: unknown): AssetsResponse {
  const payload = body as AssetsResponse;
  if (!payload || !Array.isArray(payload.assets) || !payload.expo_config) {
    throw new Error("malformed payload");
  }
  return payload;
}

export async function runWebFlow(args: WebFlowArgs): Promise<AssetsResponse> {
  const expectedOrigin = new URL(args.webUrl).origin;
  const handle = await startLoopbackServer<AssetsResponse>({
    expectedOrigin,
    validate: validateAssets,
  });

  const projectName = basename(process.cwd());
  const params = new URLSearchParams({
    cli_callback: `http://127.0.0.1:${handle.port}/result`,
    cli_token: handle.token,
    cli_project: projectName,
  });
  const browserUrl = `${args.webUrl}/?${params.toString()}`;

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
    return await Promise.race([handle.payloadPromise, timeout]);
  } finally {
    handle.close();
  }
}

export function openInBrowser(url: string): boolean {
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
