"""Generate all app icon asset sizes from an in-memory source image."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from background import create_background

ASSETS = [
    {"name": "splash.png", "size": (1284, 2778), "icon_fraction": 0.33, "has_background": True},
    {"name": "icon.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True},
    {"name": "adaptive-icon.png", "size": (1024, 1024), "icon_fraction": 0.72, "has_background": False},
    {"name": "splash-icon.png", "size": (1024, 1024), "icon_fraction": 0.70, "has_background": False},
    {"name": "favicon.png", "size": (48, 48), "icon_fraction": 0.84, "has_background": False},
]


def _tight_crop_rgba(image: Image.Image) -> Image.Image:
    """Crop to visible content using alpha channel; return original if fully opaque/no bbox."""
    rgba = image.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        return rgba
    return rgba.crop(bbox)


def _place_icon_centered(
    canvas: Image.Image,
    icon: Image.Image,
    icon_fraction: float,
) -> Image.Image:
    """Place icon centered on an existing canvas."""
    target_w, target_h = canvas.size
    cropped = _tight_crop_rgba(icon)
    src_w, src_h = cropped.size

    max_icon_side = max(1, int(min(target_w, target_h) * icon_fraction))
    scale = min(max_icon_side / src_w, max_icon_side / src_h)
    resized = cropped.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)

    x = (target_w - resized.width) // 2
    y = (target_h - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def generate_all_assets(
    source: Image.Image,
    bg_config: dict,
    output_dir: Path,
) -> list[Path]:
    """Generate all 5 asset sizes from an in-memory source image.

    Returns list of written file paths.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    for asset in ASSETS:
        size = asset["size"]

        if asset["has_background"]:
            canvas = create_background(size, bg_config, source=source)
        else:
            canvas = Image.new("RGBA", size, (0, 0, 0, 0))

        _place_icon_centered(canvas, source, asset["icon_fraction"])
        out_path = output_dir / asset["name"]
        canvas.save(out_path, format="PNG")
        written.append(out_path)

    return written
