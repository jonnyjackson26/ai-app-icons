// Request types

export interface GenerateRequest {
  description: string;
  size?: string;
  mode?: string;
}

export interface EditRequest {
  image_base64: string;
  instruction: string;
  size?: string;
}

export interface BackgroundConfig {
  type: "solid" | "gradient";
  color?: string;
  colors?: string[];
  direction?: string;
}

export interface AssetsRequest {
  image_base64: string;
  background: BackgroundConfig;
}

// Response types

export interface ImageResponse {
  image_base64: string;
  message: string;
}

export interface AssetFile {
  name: string;
  width: number;
  height: number;
  has_background: boolean;
  platform: "general" | "ios" | "android" | "web";
  variant: "standard" | "dark" | "tinted" | "monochrome";
  image_base64: string;
}

export interface AssetsResponse {
  assets: AssetFile[];
  background_color: string;
  expo_config: Record<string, unknown>;
}

export interface BackgroundTypeInfo {
  type: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
}

export interface HealthResponse {
  status: string;
  version: string;
}

