import type {
  AssetsResponse,
  BackgroundConfig,
  BackgroundTypeInfo,
  HealthResponse,
  ImageResponse,
} from "./types";
import { createClient } from "./supabase/browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class QuotaExceededError extends Error {
  limit: number;
  used: number;
  tier: string;
  windowDays: number;

  constructor(detail: {
    limit: number;
    used: number;
    tier: string;
    window_days: number;
  }) {
    super("Quota exceeded");
    this.name = "QuotaExceededError";
    this.limit = detail.limit;
    this.used = detail.used;
    this.tier = detail.tier;
    this.windowDays = detail.window_days;
  }
}

export class AuthRequiredError extends Error {
  constructor(message = "Sign in to continue") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

async function getAccessToken(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[api] getSession error:", error.message);
      return null;
    }
    return data.session?.access_token ?? null;
  } catch (e) {
    console.warn("[api] getSession threw:", e);
    return null;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  const token = await getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (e) {
    console.error("[api] fetch threw:", e);
    throw new Error(
      `Couldn't reach ${API_URL}. Is the backend running? (${
        e instanceof Error ? e.message : String(e)
      })`,
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    console.warn("[api] error body:", body);

    if (res.status === 429 && body?.detail?.code === "quota_exceeded") {
      throw new QuotaExceededError(body.detail);
    }
    if (res.status === 401) {
      throw new AuthRequiredError(
        typeof body?.detail === "string" ? body.detail : "Sign in to continue",
      );
    }

    const msg =
      typeof body?.detail === "string"
        ? body.detail
        : body?.detail?.message || `API error: ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

export async function generateIcon(
  description: string,
  mode?: string,
  signal?: AbortSignal
): Promise<ImageResponse> {
  return apiFetch<ImageResponse>("/generate", {
    method: "POST",
    body: JSON.stringify(mode ? { description, mode } : { description }),
    signal,
  });
}

export async function editIcon(
  imageBase64: string,
  instruction: string,
  signal?: AbortSignal
): Promise<ImageResponse> {
  return apiFetch<ImageResponse>("/edit", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64, instruction }),
    signal,
  });
}

export async function generateAssets(
  imageBase64: string,
  background: BackgroundConfig,
  signal?: AbortSignal
): Promise<AssetsResponse> {
  return apiFetch<AssetsResponse>("/assets", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64, background }),
    signal,
  });
}

export async function getBackgrounds(): Promise<BackgroundTypeInfo[]> {
  return apiFetch<BackgroundTypeInfo[]>("/backgrounds");
}

export async function healthCheck(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}
