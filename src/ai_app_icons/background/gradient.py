"""Linear gradient background."""

from __future__ import annotations

import math

from PIL import Image, ImageDraw

from .color import parse_hex

NAMED_DIRECTIONS: dict[str, float] = {
    "to-right": 0,
    "to-top-right": 45,
    "to-top": 90,
    "to-top-left": 135,
    "to-left": 180,
    "to-bottom-left": 225,
    "to-bottom": 270,
    "to-bottom-right": 315,
}


def make_gradient(
    size: tuple[int, int],
    colors: list[str],
    direction: str | float = "to-bottom",
) -> Image.Image:
    """
    Create a linear gradient RGBA background.

    direction: a named direction like "to-right" or a numeric angle in degrees.
    colors:    two or more hex color stops, evenly distributed.
    """
    if len(colors) < 2:
        raise ValueError("Gradient requires at least 2 colors")

    w, h = size
    parsed = [parse_hex(c) for c in colors]

    if isinstance(direction, str):
        angle_deg = NAMED_DIRECTIONS[direction]
    else:
        angle_deg = float(direction)

    angle_rad = math.radians(90 - angle_deg)
    dx = math.cos(angle_rad)
    dy = -math.sin(angle_rad)

    img = Image.new("RGBA", (w, h))
    draw = ImageDraw.Draw(img)

    corners = [(0, 0), (w, 0), (w, h), (0, h)]
    projections = [cx * dx + cy * dy for cx, cy in corners]
    p_min = min(projections)
    p_max = max(projections)
    p_range = p_max - p_min if p_max != p_min else 1.0

    n_segments = len(parsed) - 1

    for y in range(h):
        for x in range(w):
            t = (x * dx + y * dy - p_min) / p_range
            t = max(0.0, min(1.0, t))

            seg = min(int(t * n_segments), n_segments - 1)
            local_t = (t * n_segments) - seg

            c0 = parsed[seg]
            c1 = parsed[seg + 1]
            r = int(c0[0] + (c1[0] - c0[0]) * local_t)
            g = int(c0[1] + (c1[1] - c0[1]) * local_t)
            b = int(c0[2] + (c1[2] - c0[2]) * local_t)
            draw.point((x, y), fill=(r, g, b, 255))

    return img
