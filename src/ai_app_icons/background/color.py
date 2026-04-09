"""Shared color utilities."""

from __future__ import annotations


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
