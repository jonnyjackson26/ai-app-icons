"""API route handlers."""

from __future__ import annotations

import asyncio
import base64
import tempfile
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, HTTPException
from PIL import Image

from ai_app_icons import __version__
from ai_app_icons.assets import ASSETS, generate_all_assets
from ai_app_icons.icon_gen import edit_icon, generate_icon

from .schemas import (
    AssetFile,
    AssetsRequest,
    AssetsResponse,
    BackgroundTypeInfo,
    EditRequest,
    GenerateRequest,
    HealthResponse,
    ImageResponse,
)

router = APIRouter()


def _image_to_base64(image: Image.Image) -> str:
    """Encode a PIL Image as a base64 PNG string."""
    buf = BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _base64_to_image(b64: str) -> Image.Image:
    """Decode a base64 string to a PIL Image."""
    image_bytes = base64.b64decode(b64)
    return Image.open(BytesIO(image_bytes)).convert("RGBA")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(version=__version__)


@router.post("/generate", response_model=ImageResponse)
async def generate(req: GenerateRequest):
    """Generate a new app icon from a text description.

    Returns a base64-encoded PNG with transparent background.
    """
    try:
        image = await asyncio.to_thread(
            generate_icon, req.description, size=req.size
        )
        return ImageResponse(image_base64=_image_to_base64(image))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit", response_model=ImageResponse)
async def edit(req: EditRequest):
    """Edit an existing icon based on a text instruction.

    Send the current icon as base64 and describe what to change.
    """
    try:
        source = _base64_to_image(req.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    try:
        image, message = await asyncio.to_thread(
            edit_icon, source, req.instruction, size=req.size
        )
        return ImageResponse(
            image_base64=_image_to_base64(image),
            message=message,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assets", response_model=AssetsResponse)
async def assets(req: AssetsRequest):
    """Generate all 5 asset sizes from an icon.

    Returns each asset as a named base64-encoded PNG.
    """
    try:
        source = _base64_to_image(req.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    bg_config = req.background.model_dump(exclude_none=True)

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            await asyncio.to_thread(
                generate_all_assets, source, bg_config, Path(tmpdir)
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        asset_files: list[AssetFile] = []
        for asset in ASSETS:
            file_path = Path(tmpdir) / asset["name"]
            img = Image.open(file_path)
            w, h = asset["size"]
            asset_files.append(AssetFile(
                name=asset["name"],
                width=w,
                height=h,
                has_background=asset["has_background"],
                image_base64=_image_to_base64(img),
            ))

    return AssetsResponse(assets=asset_files)


@router.get("/backgrounds", response_model=list[BackgroundTypeInfo])
async def backgrounds():
    """List available background types and their configuration."""
    return [
        BackgroundTypeInfo(
            type="auto",
            description="Smart gradient derived from the icon's dominant colors",
            required_fields=[],
            optional_fields=["direction"],
        ),
        BackgroundTypeInfo(
            type="solid",
            description="Single solid hex color",
            required_fields=["color"],
            optional_fields=[],
        ),
        BackgroundTypeInfo(
            type="gradient",
            description="Linear gradient with 2+ color stops",
            required_fields=["colors"],
            optional_fields=["direction"],
        ),
        BackgroundTypeInfo(
            type="image",
            description="External image file, scaled to cover",
            required_fields=["path"],
            optional_fields=[],
        ),
    ]
