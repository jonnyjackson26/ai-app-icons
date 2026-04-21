import kleur from "kleur";
import { startLoopbackServer } from "./loopback.js";
import { openInBrowser } from "./webFlow.js";
import { writeCredentials } from "./credentials.js";

export interface LoginArgs {
  webUrl: string;
  apiUrl: string;
  timeoutMs: number;
}

interface LoginPayload {
  token: string;
}

function validateLoginPayload(body: unknown): LoginPayload {
  const payload = body as LoginPayload;
  if (!payload || typeof payload.token !== "string" || !payload.token.startsWith("caik_")) {
    throw new Error("malformed login payload");
  }
  return payload;
}

export async function runLogin(args: LoginArgs): Promise<void> {
  const expectedOrigin = new URL(args.webUrl).origin;
  const handle = await startLoopbackServer<LoginPayload>({
    expectedOrigin,
    validate: validateLoginPayload,
  });

  const params = new URLSearchParams({
    cli_callback: `http://127.0.0.1:${handle.port}/result`,
    cli_token: handle.token,
  });
  const browserUrl = `${args.webUrl}/cli-login?${params.toString()}`;

  const opened = openInBrowser(browserUrl);
  if (opened) {
    console.log(kleur.dim("Opened the sign-in page in your browser."));
  } else {
    console.log(kleur.yellow("Couldn't open your browser automatically."));
  }
  console.log(kleur.dim("If needed, paste this URL manually:"));
  console.log("  " + kleur.cyan(browserUrl));
  console.log(kleur.dim("Waiting for you to sign in..."));

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Timed out waiting for browser sign-in.")),
      args.timeoutMs,
    ),
  );

  let payload: LoginPayload;
  try {
    payload = await Promise.race([handle.payloadPromise, timeout]);
  } finally {
    handle.close();
  }

  writeCredentials({ token: payload.token, api_url: args.apiUrl });
  console.log(kleur.green("\n  Signed in. Credentials saved."));
}
