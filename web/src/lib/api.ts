import type {
  AssetsResponse,
  BackgroundConfig,
  BackgroundTypeInfo,
  HealthResponse,
  ImageResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function generateIcon(
  description: string
): Promise<ImageResponse> {
  return apiFetch<ImageResponse>("/generate", {
    method: "POST",
    body: JSON.stringify({ description }),
  });
}

export async function editIcon(
  imageBase64: string,
  instruction: string
): Promise<ImageResponse> {
  return apiFetch<ImageResponse>("/edit", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64, instruction }),
  });
}

export async function generateAssets(
  imageBase64: string,
  background: BackgroundConfig
): Promise<AssetsResponse> {
  return apiFetch<AssetsResponse>("/assets", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64, background }),
  });
}

export async function getBackgrounds(): Promise<BackgroundTypeInfo[]> {
  return apiFetch<BackgroundTypeInfo[]>("/backgrounds");
}

export async function healthCheck(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}
