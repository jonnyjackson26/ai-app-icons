"""Pydantic request/response models for the API."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    """Generate a new app icon from a text description."""
    description: str = Field(
        ...,
        description="Plain-language description of the app icon to generate",
        examples=["A friendly robot mascot for a coding education app"],
    )
    size: str = Field(
        default="1024x1024",
        description="Image dimensions",
    )


class EditRequest(BaseModel):
    """Edit an existing icon with a text instruction."""
    image_base64: str = Field(
        ...,
        description="Base64-encoded PNG of the current icon",
    )
    instruction: str = Field(
        ...,
        description="What to change about the icon",
        examples=["Make the colors warmer", "Add a subtle shadow"],
    )
    size: str = Field(
        default="1024x1024",
        description="Image dimensions",
    )


class AssetsRequest(BaseModel):
    """Generate all Expo-compatible asset files from an icon."""
    image_base64: str = Field(
        ...,
        description="Base64-encoded PNG of the source icon",
    )
    background: BackgroundConfig = Field(
        ...,
        description="Background configuration",
    )


class BackgroundConfig(BaseModel):
    """Background configuration for asset generation."""
    type: str = Field(
        ...,
        description="Background type: solid, gradient, or image",
    )
    color: str | None = Field(
        default=None,
        description="Hex color for solid backgrounds (e.g. #1a1a2e)",
    )
    colors: list[str] | None = Field(
        default=None,
        description="List of hex colors for gradient backgrounds",
    )
    direction: str = Field(
        default="to-bottom-right",
        description="Gradient direction (e.g. to-bottom, to-right, to-bottom-right)",
    )


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class ImageResponse(BaseModel):
    """Response containing a generated/edited icon."""
    image_base64: str = Field(
        ...,
        description="Base64-encoded PNG image",
    )
    message: str = Field(
        default="",
        description="Optional message from the model",
    )


class AssetsResponse(BaseModel):
    """Response containing all generated Expo asset files."""
    assets: list[AssetFile] = Field(
        ...,
        description="List of generated asset files",
    )
    background_color: str = Field(
        ...,
        description="Resolved hex color for Android adaptiveIcon.backgroundColor",
    )
    expo_config: dict = Field(
        ...,
        description="Suggested Expo app.json config snippet for these assets",
    )


class AssetFile(BaseModel):
    """A single generated asset file."""
    name: str = Field(..., description="Filename (e.g. icon.png)")
    width: int
    height: int
    has_background: bool
    platform: str = Field(..., description="Target platform: general, ios, android, web")
    variant: str = Field(..., description="Asset variant: standard, dark, tinted, monochrome")
    image_base64: str = Field(
        ...,
        description="Base64-encoded PNG image",
    )


class BackgroundTypeInfo(BaseModel):
    """Info about an available background type."""
    type: str
    description: str
    required_fields: list[str]
    optional_fields: list[str]


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str


# Fix forward reference for AssetsRequest
AssetsRequest.model_rebuild()
