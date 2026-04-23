"""API route handlers."""

from __future__ import annotations

import asyncio
import base64
import logging
import tempfile
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from openai import APIError
from PIL import Image

logger = logging.getLogger(__name__)

_INTERNAL_ERROR = "Internal error while generating icon; try again shortly."

from ai_app_icons import __version__
from ai_app_icons.assets import ASSETS, build_expo_config, generate_all_assets
from ai_app_icons.icon_gen import edit_icon, generate_icon
from ai_app_icons.modes import DEFAULT_MODE_ID, MODES

from .auth import User, auth_required, get_current_user
from .quota import check_quota, record_usage
from .schemas import (
    AssetFile,
    AssetsRequest,
    AssetsResponse,
    BackgroundTypeInfo,
    ConfigResponse,
    EditRequest,
    GenerateRequest,
    HealthResponse,
    ImageResponse,
    ModeInfo,
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

@router.get("/", include_in_schema=False)
async def root():
    """Redirect to interactive API docs."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


@router.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(version=__version__)


@router.get("/config", response_model=ConfigResponse)
async def config():
    """Public server config. The CLI calls this before requesting credentials."""
    return ConfigResponse(auth_required=auth_required())


@router.post("/generate", response_model=ImageResponse)
async def generate(
    req: GenerateRequest,
    user: User = Depends(check_quota),
):
    """Generate a new app icon from a text description.

    Returns a base64-encoded PNG with transparent background.
    """
    try:
        image, usage = await asyncio.to_thread(
            generate_icon, req.description, size=req.size, mode=req.mode
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except APIError:
        raise
    except Exception:
        logger.exception("[generate] unexpected failure")
        raise HTTPException(status_code=500, detail=_INTERNAL_ERROR)

    record_usage(user, "generate", usage)
    return ImageResponse(image_base64=_image_to_base64(image))


@router.post("/edit", response_model=ImageResponse)
async def edit(
    req: EditRequest,
    user: User = Depends(check_quota),
):
    """Edit an existing icon based on a text instruction.

    Send the current icon as base64 and describe what to change.
    """
    try:
        source = _base64_to_image(req.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    try:
        image, message, usage = await asyncio.to_thread(
            edit_icon, source, req.instruction, size=req.size
        )
    except APIError:
        raise
    except Exception:
        logger.exception("[edit] unexpected failure")
        raise HTTPException(status_code=500, detail=_INTERNAL_ERROR)

    record_usage(user, "edit", usage)
    return ImageResponse(
        image_base64=_image_to_base64(image),
        message=message,
    )


@router.post("/assets", response_model=AssetsResponse)
async def assets(
    req: AssetsRequest,
    _user: User = Depends(get_current_user),
):
    """Generate all Expo-compatible asset files from an icon.

    Returns each asset as a named base64-encoded PNG, plus the resolved
    background color and a suggested Expo app.json config snippet.
    """
    try:
        source = _base64_to_image(req.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    bg_config = req.background.model_dump(exclude_none=True)

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            _written, bg_color = await asyncio.to_thread(
                generate_all_assets,
                source,
                bg_config,
                Path(tmpdir),
                req.ios_single_color_style,
            )
        except APIError:
            raise
        except Exception:
            logger.exception("[assets] unexpected failure")
            raise HTTPException(status_code=500, detail=_INTERNAL_ERROR)

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
                platform=asset["platform"],
                variant=asset["variant"],
                image_base64=_image_to_base64(img),
            ))

    expo_config = build_expo_config(bg_color)

    return AssetsResponse(
        assets=asset_files,
        background_color=bg_color,
        expo_config=expo_config,
    )


@router.get("/modes", response_model=list[ModeInfo])
async def modes():
    """List available style modes for icon generation."""
    return [
        ModeInfo(
            id=m.id,
            name=m.name,
            description=m.description,
            is_default=m.id == DEFAULT_MODE_ID,
        )
        for m in MODES.values()
    ]


@router.get("/backgrounds", response_model=list[BackgroundTypeInfo])
async def backgrounds():
    """List available background types and their configuration."""
    return [
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
