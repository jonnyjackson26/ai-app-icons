// Request types

export interface GenerateRequest {
  description: string;
  size?: string;
}

export interface EditRequest {
  image_base64: string;
  instruction: string;
  size?: string;
}

export interface BackgroundConfig {
  type: "auto" | "solid" | "gradient";
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

// Wizard state

export type WizardStep =
  | "describe"
  | "generating"
  | "review"
  | "refining"
  | "background"
  | "exporting"
  | "export";

export interface WizardState {
  step: WizardStep;
  description: string;
  iconBase64: string | null;
  editMessage: string;
  backgroundConfig: BackgroundConfig;
  assets: AssetFile[] | null;
  expoConfig: Record<string, unknown> | null;
  backgroundColor: string | null;
  error: string | null;
}

export type WizardAction =
  | { type: "SET_DESCRIPTION"; description: string }
  | { type: "UPLOAD_ICON"; iconBase64: string }
  | { type: "UPLOAD_LOGO"; iconBase64: string }
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCESS"; iconBase64: string }
  | { type: "GENERATE_ERROR"; error: string }
  | { type: "ACCEPT_ICON" }
  | { type: "REQUEST_REFINE" }
  | { type: "REFINE_START" }
  | { type: "REFINE_SUCCESS"; iconBase64: string; message: string }
  | { type: "REFINE_ERROR"; error: string }
  | { type: "SET_BACKGROUND"; config: BackgroundConfig }
  | { type: "EXPORT_START" }
  | { type: "EXPORT_SUCCESS"; assets: AssetFile[]; expoConfig: Record<string, unknown>; backgroundColor: string }
  | { type: "EXPORT_ERROR"; error: string }
  | { type: "START_OVER" }
  | { type: "CLEAR_ERROR" };
