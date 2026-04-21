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

export interface ServerConfig {
  auth_required: boolean;
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
  constructor(
    private baseUrl: string,
    private authToken: string | null = null,
  ) {}

  async getConfig(): Promise<ServerConfig> {
    return this.request<ServerConfig>("GET", "/config");
  }

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
    const headers: Record<string, string> = {};
    if (body) headers["Content-Type"] = "application/json";
    if (this.authToken) headers["Authorization"] = `Bearer ${this.authToken}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const parsed = (await res.json().catch(() => null)) as
        | { detail?: unknown }
        | null;
      const detail =
        typeof parsed?.detail === "string"
          ? parsed.detail
          : parsed?.detail
            ? JSON.stringify(parsed.detail)
            : `HTTP ${res.status}`;
      throw new ApiError(res.status, detail);
    }
    return (await res.json()) as T;
  }
}
