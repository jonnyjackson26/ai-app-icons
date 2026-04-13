"""Shared color utilities."""

from __future__ import annotations

import colorsys


def parse_hex(color: str) -> tuple[int, int, int]:
    """Parse a hex color string (#RGB or #RRGGBB) to an (R, G, B) tuple."""
    c = color.lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    if len(c) != 6:
        raise ValueError(f"Invalid hex color: {color!r}")
    return int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert an (R, G, B) tuple to a #RRGGBB hex string."""
    return f"#{r:02x}{g:02x}{b:02x}"


def rgb_to_hsl(r: int, g: int, b: int) -> tuple[float, float, float]:
    """Return (hue 0-360, saturation 0-1, lightness 0-1)."""
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s, l


def hsl_to_rgb(h: float, s: float, l: float) -> tuple[int, int, int]:
    """Convert HSL back to 0-255 RGB."""
    r, g, b = colorsys.hls_to_rgb(h / 360, l, s)
    return min(255, max(0, int(r * 255))), min(255, max(0, int(g * 255))), min(255, max(0, int(b * 255)))
