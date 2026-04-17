"""
Background package — pluggable background generators for icon assets.

Supported types:
  solid    – single hex color
  gradient – linear gradient with 2+ color stops
  image    – external image file, scaled to cover
"""

from __future__ import annotations

from PIL import Image

from .gradient import make_gradient
from .image import make_image_bg
from .solid import make_solid


def create_background(
    size: tuple[int, int],
    config: dict,
) -> Image.Image:
    """Build a background image according to *config*."""
    bg_type = config.get("type")

    if bg_type == "solid":
        return make_solid(size, config["color"])

    if bg_type == "gradient":
        return make_gradient(size, config["colors"], config.get("direction", "to-bottom"))

    if bg_type == "image":
        return make_image_bg(size, config["path"])

    raise ValueError(f"Unknown background type: {bg_type!r}")
