"""Solid color background."""

from __future__ import annotations

from PIL import Image

from .color import parse_hex


def make_solid(size: tuple[int, int], color: str) -> Image.Image:
    """Create a solid-color RGBA background."""
    r, g, b = parse_hex(color)
    return Image.new("RGBA", size, (r, g, b, 255))
