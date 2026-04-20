export interface ModeInfo {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
}

export interface AssetFile {
  name: string;
  width: number;
  height: number;
  has_background: boolean;
  platform: string;
  variant: string;
  image_base64: string;
}

export interface AssetsResponse {
  assets: AssetFile[];
  background_color: string;
  expo_config: Record<string, unknown>;
}

export interface BackgroundConfig {
  type: "solid" | "gradient";
  color?: string;
  colors?: string[];
  direction?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  async getModes(): Promise<ModeInfo[]> {
    return this.request<ModeInfo[]>("GET", "/modes");
  }

  async generateIcon(description: string, mode: string | null): Promise<string> {
    const body: Record<string, unknown> = { description };
    if (mode) body.mode = mode;
    const res = await this.request<{ image_base64: string }>("POST", "/generate", body);
    return res.image_base64;
  }

  async generateAssets(
    imageBase64: string,
    background: BackgroundConfig,
  ): Promise<AssetsResponse> {
    return this.request<AssetsResponse>("POST", "/assets", {
      image_base64: imageBase64,
      background,
    });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const parsed = (await res.json().catch(() => null)) as
        | { detail?: string }
        | null;
      throw new ApiError(res.status, parsed?.detail ?? `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }
}
