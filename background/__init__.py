"""
Background package — pluggable background generators for icon assets.

Supported types:
  auto     – derives a gradient from the icon's dominant colors (default)
  solid    – single hex color
  gradient – linear gradient with 2+ color stops
  image    – external image file, scaled to cover
"""

from __future__ import annotations

from PIL import Image

from background.auto import make_auto
from background.gradient import make_gradient
from background.image import make_image_bg
from background.solid import make_solid

DEFAULT_BG_CONFIG: dict = {"type": "auto"}


def create_background(
    size: tuple[int, int],
    config: dict,
    source: Image.Image | None = None,
) -> Image.Image:
    """Build a background image according to *config*."""
    bg_type = config.get("type", "auto")

    if bg_type == "auto":
        if source is None:
            raise ValueError("'auto' background requires the source icon")
        return make_auto(size, source, config.get("direction", "to-bottom-right"))

    if bg_type == "solid":
        return make_solid(size, config["color"])

    if bg_type == "gradient":
        return make_gradient(size, config["colors"], config.get("direction", "to-bottom"))

    if bg_type == "image":
        return make_image_bg(size, config["path"])

    raise ValueError(f"Unknown background type: {bg_type!r}")
