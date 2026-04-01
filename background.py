"""
Background generators for icon assets.

Supports: solid color, linear gradient, image, and average-color modes.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw


def _parse_hex(color: str) -> tuple[int, int, int]:
    """Parse a hex color string (#RGB, #RRGGBB) to an (R, G, B) tuple."""
    c = color.lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    if len(c) != 6:
        raise ValueError(f"Invalid hex color: {color!r}")
    return int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)


def _direction_to_angle(direction: str) -> float:
    """Convert a named direction to degrees (0 = right, 90 = up, measured counter-clockwise)."""
    mapping = {
        "to-right": 0,
        "to-top-right": 45,
        "to-top": 90,
        "to-top-left": 135,
        "to-left": 180,
        "to-bottom-left": 225,
        "to-bottom": 270,
        "to-bottom-right": 315,
    }
    return mapping[direction]


def make_solid(size: tuple[int, int], color: str) -> Image.Image:
    """Create a solid-color RGBA background."""
    r, g, b = _parse_hex(color)
    return Image.new("RGBA", size, (r, g, b, 255))


def make_gradient(
    size: tuple[int, int],
    colors: list[str],
    direction: str | float,
) -> Image.Image:
    """
    Create a linear gradient RGBA background.

    direction: a named direction like "to-right" or a numeric angle in degrees
               (0 = right, 90 = up, counter-clockwise — CSS-style).
    colors:    two or more hex color stops, evenly distributed.
    """
    if len(colors) < 2:
        raise ValueError("Gradient requires at least 2 colors")

    w, h = size
    parsed = [_parse_hex(c) for c in colors]

    if isinstance(direction, str):
        angle_deg = _direction_to_angle(direction)
    else:
        angle_deg = float(direction)

    # Convert to radians; CSS convention: 0deg = to-top, 90deg = to-right.
    # We use math convention internally.
    angle_rad = math.radians(90 - angle_deg)
    dx = math.cos(angle_rad)
    dy = -math.sin(angle_rad)  # y-axis is inverted in image coords

    img = Image.new("RGBA", (w, h))
    draw = ImageDraw.Draw(img)

    # Project corners to find min/max along the gradient axis.
    corners = [(0, 0), (w, 0), (w, h), (0, h)]
    projections = [cx * dx + cy * dy for cx, cy in corners]
    p_min = min(projections)
    p_max = max(projections)
    p_range = p_max - p_min if p_max != p_min else 1.0

    n_segments = len(parsed) - 1

    for y in range(h):
        for x in range(w):
            t = (x * dx + y * dy - p_min) / p_range  # 0..1 along gradient
            t = max(0.0, min(1.0, t))

            # Find which segment this falls in
            seg = min(int(t * n_segments), n_segments - 1)
            local_t = (t * n_segments) - seg

            c0 = parsed[seg]
            c1 = parsed[seg + 1]
            r = int(c0[0] + (c1[0] - c0[0]) * local_t)
            g = int(c0[1] + (c1[1] - c0[1]) * local_t)
            b = int(c0[2] + (c1[2] - c0[2]) * local_t)
            draw.point((x, y), fill=(r, g, b, 255))

    return img


def make_image_bg(size: tuple[int, int], path: str | Path) -> Image.Image:
    """Load an image and resize/crop it to cover the target size."""
    src = Image.open(path).convert("RGBA")
    src_w, src_h = src.size
    target_w, target_h = size

    # Scale to cover
    scale = max(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    resized = src.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Center-crop
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def make_average(size: tuple[int, int], source: Image.Image, darken: float = 0.85) -> Image.Image:
    """Create a background using the alpha-weighted average color of the source icon."""
    rgba = source.convert("RGBA")
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
        avg = (24, 24, 24)
    else:
        avg = (int(r_total / a_total), int(g_total / a_total), int(b_total / a_total))

    bg = (
        max(0, int(avg[0] * darken)),
        max(0, int(avg[1] * darken)),
        max(0, int(avg[2] * darken)),
        255,
    )
    return Image.new("RGBA", size, bg)


def create_background(
    size: tuple[int, int],
    config: dict,
    source: Image.Image | None = None,
) -> Image.Image:
    """
    Dispatch to the right background generator based on config["type"].

    config must have a "type" key: "solid", "gradient", "image", or "average".
    """
    bg_type = config.get("type", "average")

    if bg_type == "solid":
        return make_solid(size, config["color"])

    if bg_type == "gradient":
        return make_gradient(size, config["colors"], config.get("direction", "to-bottom"))

    if bg_type == "image":
        return make_image_bg(size, config["path"])

    if bg_type == "average":
        if source is None:
            raise ValueError("'average' background requires the source icon")
        return make_average(size, source, config.get("darken", 0.85))

    raise ValueError(f"Unknown background type: {bg_type!r}")
