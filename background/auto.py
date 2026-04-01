"""
Auto-gradient background generator.

Analyzes the source icon's colors and produces a two-color gradient
that complements the icon.

Algorithm:
  1. Resize icon small & extract visible (non-transparent) pixels.
  2. Quantize to find dominant colors.
  3. Measure palette diversity (hue spread).
  4. Multi-color icon → pick the two most distinct dominant colors.
     Monochrome icon  → generate an analogous-hue gradient with
                        meaningful lightness spread.
  5. Ensure minimum perceptual contrast between the two colors and
     against the icon itself.
  6. Order darker color first for a natural top-to-bottom feel.
"""

from __future__ import annotations

import colorsys
from collections import Counter

from PIL import Image

from background.color import rgb_to_hex
from background.gradient import make_gradient

# --- Color-space helpers -------------------------------------------------- #


def _rgb_to_hsl(r: int, g: int, b: int) -> tuple[float, float, float]:
    """Return (hue 0-360, saturation 0-1, lightness 0-1)."""
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s, l


def _hsl_to_rgb(h: float, s: float, l: float) -> tuple[int, int, int]:
    """Convert HSL back to 0-255 RGB."""
    r, g, b = colorsys.hls_to_rgb(h / 360, l, s)
    return min(255, max(0, int(r * 255))), min(255, max(0, int(g * 255))), min(255, max(0, int(b * 255)))


def _perceived_brightness(r: int, g: int, b: int) -> float:
    """Perceptual brightness 0-1 (ITU-R BT.601)."""
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255


def _hue_distance(h1: float, h2: float) -> float:
    """Shortest angular distance between two hues (0-180)."""
    d = abs(h1 - h2)
    return d if d <= 180 else 360 - d


def _color_distance(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    """Simple Euclidean RGB distance, 0-441."""
    return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2) ** 0.5


# --- Dominant-color extraction -------------------------------------------- #


def _extract_dominant_colors(
    source: Image.Image,
    n_colors: int = 8,
) -> list[tuple[tuple[int, int, int], int]]:
    """Return up to *n_colors* dominant (R,G,B) values with pixel counts."""
    rgba = source.convert("RGBA")
    thumb = rgba.resize((64, 64), Image.Resampling.LANCZOS)
    pixels = list(thumb.getdata())

    visible = [(r, g, b) for r, g, b, a in pixels if a > 128]
    if not visible:
        return [((24, 24, 24), 1)]

    temp = Image.new("RGB", (len(visible), 1))
    temp.putdata(visible)
    quantized = temp.quantize(colors=n_colors, method=Image.Quantize.MEDIANCUT)
    palette = quantized.getpalette()

    counts = Counter(quantized.getdata())
    colors: list[tuple[tuple[int, int, int], int]] = []
    for idx, count in counts.most_common():
        r = palette[idx * 3]
        g = palette[idx * 3 + 1]
        b = palette[idx * 3 + 2]
        colors.append(((r, g, b), count))

    return colors


# --- Palette analysis ----------------------------------------------------- #


def _palette_diversity(colors: list[tuple[tuple[int, int, int], int]]) -> float:
    """Return 0-1 measuring how spread the palette hues are. 0 = monochrome."""
    chromatic_hues: list[float] = []
    for (r, g, b), _ in colors:
        h, s, _ = _rgb_to_hsl(r, g, b)
        if s > 0.08:
            chromatic_hues.append(h)

    if len(chromatic_hues) <= 1:
        return 0.0

    max_diff = 0.0
    for i in range(len(chromatic_hues)):
        for j in range(i + 1, len(chromatic_hues)):
            max_diff = max(max_diff, _hue_distance(chromatic_hues[i], chromatic_hues[j]))

    return min(max_diff / 90, 1.0)  # ≥90° apart = fully diverse


# --- Gradient generation strategies --------------------------------------- #


def _generate_analogous(
    primary_h: float,
    primary_s: float,
    primary_l: float,
    icon_brightness: float,
) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    """
    Create a gradient from a monochrome icon's primary hue.

    Shifts the hue ±35° and spreads lightness so the gradient is
    clearly visible while staying harmonious with the icon.
    """
    s = max(0.45, min(1.0, primary_s * 1.4))

    # Pick lightness range that contrasts with the icon
    if icon_brightness < 0.4:
        # Dark icon → medium-light background
        l1, l2 = 0.38, 0.58
    elif icon_brightness > 0.7:
        # Light icon → medium-dark background
        l1, l2 = 0.22, 0.40
    else:
        # Mid-tone icon → straddle around it
        l1, l2 = 0.28, 0.50

    c1 = _hsl_to_rgb((primary_h - 35) % 360, s, l1)
    c2 = _hsl_to_rgb((primary_h + 35) % 360, s * 0.85, l2)
    return c1, c2


def _pick_from_palette(
    colors: list[tuple[tuple[int, int, int], int]],
) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    """
    Pick the best pair from a multi-color palette.

    Scores by hue separation, saturation, and dominance, then adjusts
    for background use.
    """
    total_pixels = sum(c[1] for c in colors)
    best_score = -1.0
    best_pair: tuple[int, int] | None = None

    for i in range(len(colors)):
        for j in range(i + 1, len(colors)):
            rgb1, freq1 = colors[i]
            rgb2, freq2 = colors[j]

            h1, s1, _ = _rgb_to_hsl(*rgb1)
            h2, s2, _ = _rgb_to_hsl(*rgb2)

            hue_diff = _hue_distance(h1, h2)
            hue_score = min(hue_diff / 60, 1.0)
            sat_score = (s1 + s2) / 2
            freq_score = (freq1 + freq2) / total_pixels

            score = hue_score * 0.4 + sat_score * 0.3 + freq_score * 0.3
            if score > best_score:
                best_score = score
                best_pair = (i, j)

    i, j = best_pair or (0, min(1, len(colors) - 1))
    rgb1 = colors[i][0]
    rgb2 = colors[j][0]

    h1, s1, l1 = _rgb_to_hsl(*rgb1)
    h2, s2, l2 = _rgb_to_hsl(*rgb2)

    # Adjust for background: boost saturation, clamp lightness
    s1 = min(1.0, s1 * 1.3) if s1 > 0.10 else max(s1, 0.30)
    s2 = min(1.0, s2 * 1.3) if s2 > 0.10 else max(s2, 0.30)
    l1 = max(0.25, min(0.55, l1))
    l2 = max(0.25, min(0.55, l2))

    # Ensure minimum lightness spread so the gradient is visible
    if abs(l1 - l2) < 0.12:
        mid = (l1 + l2) / 2
        l1 = max(0.22, mid - 0.10)
        l2 = min(0.58, mid + 0.10)

    return _hsl_to_rgb(h1, s1, l1), _hsl_to_rgb(h2, s2, l2)


# --- Contrast enforcement ------------------------------------------------ #


def _ensure_min_distance(
    c1: tuple[int, int, int],
    c2: tuple[int, int, int],
    min_dist: float = 60.0,
) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    """If the two colors are too similar, push them apart in lightness."""
    if _color_distance(c1, c2) >= min_dist:
        return c1, c2

    h1, s1, l1 = _rgb_to_hsl(*c1)
    h2, s2, l2 = _rgb_to_hsl(*c2)

    # Spread lightness
    mid = (l1 + l2) / 2
    l1 = max(0.20, mid - 0.14)
    l2 = min(0.62, mid + 0.14)

    # Also nudge hues apart if they're nearly identical
    if _hue_distance(h1, h2) < 20:
        h1 = (h1 - 20) % 360
        h2 = (h2 + 20) % 360

    return _hsl_to_rgb(h1, s1, l1), _hsl_to_rgb(h2, s2, l2)


# --- Public API ----------------------------------------------------------- #


def auto_gradient_colors(source: Image.Image) -> tuple[str, str]:
    """Analyze the icon and return two hex colors for a gradient."""
    colors = _extract_dominant_colors(source)
    diversity = _palette_diversity(colors)

    # Weighted-average brightness of the icon
    total = sum(c[1] for c in colors)
    icon_brightness = sum(
        _perceived_brightness(*rgb) * freq for rgb, freq in colors
    ) / total

    if diversity >= 0.35 and len(colors) >= 2:
        c1, c2 = _pick_from_palette(colors)
    else:
        primary_rgb = colors[0][0]
        p_h, p_s, p_l = _rgb_to_hsl(*primary_rgb)
        c1, c2 = _generate_analogous(p_h, p_s, p_l, icon_brightness)

    c1, c2 = _ensure_min_distance(c1, c2)

    # Darker color first → natural top-to-bottom gradient
    if _perceived_brightness(*c1) > _perceived_brightness(*c2):
        c1, c2 = c2, c1

    return rgb_to_hex(*c1), rgb_to_hex(*c2)


def make_auto(
    size: tuple[int, int],
    source: Image.Image,
    direction: str | float = "to-bottom-right",
) -> Image.Image:
    """Generate a gradient background whose colors complement *source*."""
    c1, c2 = auto_gradient_colors(source)
    return make_gradient(size, [c1, c2], direction)
