"""Image file background."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


def make_image_bg(size: tuple[int, int], path: str | Path) -> Image.Image:
    """Load an image and resize/crop it to cover the target size."""
    src = Image.open(path).convert("RGBA")
    src_w, src_h = src.size
    target_w, target_h = size

    scale = max(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    resized = src.resize((new_w, new_h), Image.Resampling.LANCZOS)

    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))
