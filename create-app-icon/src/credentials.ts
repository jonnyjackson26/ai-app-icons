import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

const APP_DIR = "create-app-icon";
const FILENAME = "credentials.json";

function configDir(): string {
  if (platform() === "win32") {
    const appdata = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
    return join(appdata, APP_DIR);
  }
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && xdg.startsWith("/")) return join(xdg, APP_DIR);
  return join(homedir(), ".config", APP_DIR);
}

export function credentialsPath(): string {
  return join(configDir(), FILENAME);
}

export interface Credentials {
  token: string;
  api_url?: string;
}

export function readCredentials(): Credentials | null {
  const path = credentialsPath();
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as Credentials;
    if (typeof parsed?.token !== "string" || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCredentials(creds: Credentials): void {
  const path = credentialsPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(creds, null, 2));
  if (platform() !== "win32") {
    try {
      chmodSync(path, 0o600);
    } catch {
      // Best effort.
    }
  }
}

export function deleteCredentials(): boolean {
  const path = credentialsPath();
  if (!existsSync(path)) return false;
  rmSync(path, { force: true });
  return true;
}
