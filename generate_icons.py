#!/usr/bin/env python3
"""
Generate app icon assets from a single source icon.

Reads background configuration from config.json (solid, gradient, image, or average).

Default behavior:
- Input:  icon.png (repo root)
- Config: config.json (repo root)
- Output: output/ folder with:
  - splash.png        1284x2778
  - adaptive-icon.png 1024x1024 (transparent background)
  - favicon.png       48x48
  - icon.png          1024x1024 (with configured background)
  - splash-icon.png   1024x1024
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

from background import create_background

# Assets that get a background vs transparent
ASSETS = [
    {"name": "splash.png", "size": (1284, 2778), "icon_fraction": 0.33, "has_background": True},
    {"name": "adaptive-icon.png", "size": (1024, 1024), "icon_fraction": 0.72, "has_background": False},
    {"name": "favicon.png", "size": (48, 48), "icon_fraction": 0.84, "has_background": False},
    {"name": "icon.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True},
    {"name": "splash-icon.png", "size": (1024, 1024), "icon_fraction": 0.70, "has_background": False},
]

DEFAULT_BG_CONFIG = {"type": "average"}


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


def load_config(config_path: Path) -> dict:
    """Load background config from JSON file, falling back to defaults."""
    if not config_path.exists():
        return {"background": DEFAULT_BG_CONFIG}
    with open(config_path) as f:
        return json.load(f)


def generate_assets(input_path: Path, output_dir: Path, config_path: Path) -> list[Path]:
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    output_dir.mkdir(parents=True, exist_ok=True)
    source = Image.open(input_path).convert("RGBA")
    config = load_config(config_path)
    bg_config = config.get("background", DEFAULT_BG_CONFIG)

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


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate app icon assets from icon.png")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("icon.png"),
        help="Input icon path (default: icon.png)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("output"),
        help="Output directory (default: output)",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("config.json"),
        help="Config file path (default: config.json)",
    )
    args = parser.parse_args()

    written = generate_assets(args.input, args.output_dir, args.config)
    print("Generated assets:")
    for path in written:
        print(f"- {path}")


if __name__ == "__main__":
    main()
