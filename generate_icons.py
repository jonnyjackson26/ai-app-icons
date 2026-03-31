#!/usr/bin/env python3
"""
Generate app icon assets from a single source icon.

Default behavior:
- Input:  icon.png (repo root)
- Output: output/ folder with:
  - splash.png        1284x2778
  - adaptive-icon.png 1024x1024 (transparent background)
  - favicon.png       48x48
  - icon.png          1024x1024 (with generated background)
  - splash-icon.png   1024x1024
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def _tight_crop_rgba(image: Image.Image) -> Image.Image:
    """Crop to visible content using alpha channel; return original if fully opaque/no bbox."""
    rgba = image.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        return rgba
    return rgba.crop(bbox)


def _average_visible_color(image: Image.Image) -> tuple[int, int, int]:
    """Compute alpha-weighted average color from visible pixels."""
    rgba = image.convert("RGBA")
    pixels = rgba.getdata()

    r_total = g_total = b_total = a_total = 0
    for r, g, b, a in pixels:
        if a == 0:
            continue
        r_total += r * a
        g_total += g * a
        b_total += b * a
        a_total += a

    if a_total == 0:
        return 24, 24, 24

    return (
        int(r_total / a_total),
        int(g_total / a_total),
        int(b_total / a_total),
    )


def _with_icon_centered(
    icon: Image.Image,
    size: tuple[int, int],
    icon_fraction: float,
    background: tuple[int, int, int, int],
) -> Image.Image:
    """
    Create a new image and place icon centered.

    icon_fraction = fraction of min(target_w, target_h) used by icon's largest side.
    """
    target_w, target_h = size
    canvas = Image.new("RGBA", (target_w, target_h), background)

    cropped = _tight_crop_rgba(icon)
    src_w, src_h = cropped.size

    max_icon_side = max(1, int(min(target_w, target_h) * icon_fraction))
    scale = min(max_icon_side / src_w, max_icon_side / src_h)
    resized = cropped.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)

    x = (target_w - resized.width) // 2
    y = (target_h - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def generate_assets(input_path: Path, output_dir: Path) -> list[Path]:
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    output_dir.mkdir(parents=True, exist_ok=True)
    source = Image.open(input_path).convert("RGBA")

    avg_r, avg_g, avg_b = _average_visible_color(source)

    # Slightly darkened average color for a pleasant, neutral background.
    bg = (
        max(0, int(avg_r * 0.85)),
        max(0, int(avg_g * 0.85)),
        max(0, int(avg_b * 0.85)),
        255,
    )

    outputs = [
        (
            "splash.png",
            (1284, 2778),
            0.33,
            bg,
        ),
        (
            "adaptive-icon.png",
            (1024, 1024),
            0.72,
            (0, 0, 0, 0),
        ),
        (
            "favicon.png",
            (48, 48),
            0.84,
            (0, 0, 0, 0),
        ),
        (
            "icon.png",
            (1024, 1024),
            0.74,
            bg,
        ),
        (
            "splash-icon.png",
            (1024, 1024),
            0.70,
            (0, 0, 0, 0),
        ),
    ]

    written: list[Path] = []
    for filename, size, icon_fraction, background in outputs:
        image = _with_icon_centered(source, size, icon_fraction, background)
        out_path = output_dir / filename
        image.save(out_path, format="PNG")
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
    args = parser.parse_args()

    written = generate_assets(args.input, args.output_dir)
    print("Generated assets:")
    for path in written:
        print(f"- {path}")


if __name__ == "__main__":
    main()
