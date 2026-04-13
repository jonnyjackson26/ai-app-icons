"""Generate all app icon asset sizes from an in-memory source image."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance

from ai_app_icons.background import create_background
from ai_app_icons.background.auto import auto_gradient_colors
from ai_app_icons.background.color import hsl_to_rgb, parse_hex, rgb_to_hex, rgb_to_hsl
from ai_app_icons.background.gradient import make_gradient
from ai_app_icons.background.solid import make_solid

ASSETS = [
    # --- General ---
    {"name": "icon.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True, "variant": "standard", "platform": "general"},
    # --- iOS ---
    {"name": "icon-ios.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True, "variant": "standard", "platform": "ios"},
    {"name": "icon-ios-dark.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True, "variant": "dark", "platform": "ios"},
    {"name": "icon-ios-tinted.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": False, "variant": "tinted", "platform": "ios"},
    # --- Android ---
    {"name": "adaptive-foreground.png", "size": (1024, 1024), "icon_fraction": 0.60, "has_background": False, "variant": "standard", "platform": "android"},
    {"name": "adaptive-monochrome.png", "size": (1024, 1024), "icon_fraction": 0.60, "has_background": False, "variant": "monochrome", "platform": "android"},
    # --- Splash ---
    {"name": "splash.png", "size": (1284, 2778), "icon_fraction": 0.33, "has_background": True, "variant": "standard", "platform": "general"},
    {"name": "splash-icon.png", "size": (1024, 1024), "icon_fraction": 0.70, "has_background": False, "variant": "standard", "platform": "general"},
    # --- Web ---
    {"name": "favicon.png", "size": (48, 48), "icon_fraction": 0.84, "has_background": False, "variant": "standard", "platform": "web"},
]


def _tight_crop_rgba(image: Image.Image) -> Image.Image:
    """Crop to visible content using alpha channel; return original if fully opaque/no bbox."""
    rgba = image.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        return rgba
    return rgba.crop(bbox)


def _place_icon_centered(
    canvas: Image.Image,
    icon: Image.Image,
    icon_fraction: float,
) -> Image.Image:
    """Place icon centered on an existing canvas."""
    target_w, target_h = canvas.size
    cropped = _tight_crop_rgba(icon)
    src_w, src_h = cropped.size

    max_icon_side = max(1, int(min(target_w, target_h) * icon_fraction))
    scale = min(max_icon_side / src_w, max_icon_side / src_h)
    resized = cropped.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)

    x = (target_w - resized.width) // 2
    y = (target_h - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


# --- Variant helpers ----------------------------------------------------------


def _resolve_bg_color(bg_config: dict, source: Image.Image) -> str:
    """Return a single #rrggbb hex string for the primary background color."""
    bg_type = bg_config.get("type", "auto")
    if bg_type == "solid":
        return bg_config["color"]
    if bg_type == "gradient":
        return bg_config["colors"][0]
    if bg_type == "auto":
        c1, _c2 = auto_gradient_colors(source)
        return c1
    # image or unknown — fallback
    return "#ffffff"


def _make_dark_background(
    size: tuple[int, int],
    bg_config: dict,
    source: Image.Image,
) -> Image.Image:
    """Create a dark variant of the configured background."""
    bg_type = bg_config.get("type", "auto")

    if bg_type == "image":
        canvas = create_background(size, bg_config, source=source)
        return ImageEnhance.Brightness(canvas).enhance(0.2)

    # Resolve colors
    if bg_type == "auto":
        c1_hex, c2_hex = auto_gradient_colors(source)
        colors_rgb = [parse_hex(c1_hex), parse_hex(c2_hex)]
    elif bg_type == "solid":
        colors_rgb = [parse_hex(bg_config["color"])]
    elif bg_type == "gradient":
        colors_rgb = [parse_hex(c) for c in bg_config["colors"]]
    else:
        colors_rgb = [(20, 20, 30)]

    # Darken each color
    darkened = []
    for r, g, b in colors_rgb:
        h, s, l = rgb_to_hsl(r, g, b)
        l = min(l, 0.12)
        s = max(0.0, s * 0.7)
        darkened.append(rgb_to_hex(*hsl_to_rgb(h, s, l)))

    if len(darkened) == 1:
        return make_solid(size, darkened[0])
    direction = bg_config.get("direction", "to-bottom-right")
    return make_gradient(size, darkened, direction)


def _make_tinted(source: Image.Image) -> Image.Image:
    """Convert icon to grayscale silhouette preserving alpha (iOS tinted icon)."""
    rgba = source.convert("RGBA")
    gray = rgba.convert("L")
    alpha = rgba.getchannel("A")
    return Image.merge("RGBA", (gray, gray, gray, alpha))


def _make_monochrome(source: Image.Image) -> Image.Image:
    """Convert icon to white silhouette on transparent background (Android monochrome)."""
    rgba = source.convert("RGBA")
    alpha = rgba.getchannel("A")
    white_layer = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    white_layer.putalpha(alpha)
    return white_layer


# --- Main generation ----------------------------------------------------------


def generate_all_assets(
    source: Image.Image,
    bg_config: dict,
    output_dir: Path,
) -> tuple[list[Path], str]:
    """Generate all asset sizes from an in-memory source image.

    Returns (list of written file paths, resolved background color hex).
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    bg_color = _resolve_bg_color(bg_config, source)

    for asset in ASSETS:
        size = asset["size"]
        variant = asset["variant"]

        if variant == "dark":
            canvas = _make_dark_background(size, bg_config, source)
            _place_icon_centered(canvas, source, asset["icon_fraction"])
        elif variant == "tinted":
            canvas = Image.new("RGBA", size, (0, 0, 0, 0))
            tinted_source = _make_tinted(source)
            _place_icon_centered(canvas, tinted_source, asset["icon_fraction"])
        elif variant == "monochrome":
            canvas = Image.new("RGBA", size, (0, 0, 0, 0))
            mono_source = _make_monochrome(source)
            _place_icon_centered(canvas, mono_source, asset["icon_fraction"])
        elif asset["has_background"]:
            canvas = create_background(size, bg_config, source=source)
            _place_icon_centered(canvas, source, asset["icon_fraction"])
        else:
            canvas = Image.new("RGBA", size, (0, 0, 0, 0))
            _place_icon_centered(canvas, source, asset["icon_fraction"])

        out_path = output_dir / asset["name"]
        canvas.save(out_path, format="PNG")
        written.append(out_path)

    return written, bg_color
