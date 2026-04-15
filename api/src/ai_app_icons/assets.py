"""Generate all app icon asset sizes from an in-memory source image."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from ai_app_icons.background import create_background
from ai_app_icons.background.auto import auto_gradient_colors
from ai_app_icons.background.color import parse_hex
from ai_app_icons.constants import IOS_DARK_BG

ASSETS = [
    # --- General ---
    {"name": "icon.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True, "variant": "standard", "platform": "general"},
    # --- iOS ---
    {"name": "icon-ios.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True, "variant": "standard", "platform": "ios"},
    {"name": "icon-ios-dark.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True, "variant": "dark", "platform": "ios"},
    {"name": "icon-ios-tinted.png", "size": (1024, 1024), "icon_fraction": 0.74, "has_background": True, "variant": "tinted", "platform": "ios"},
    # --- Android ---
    {"name": "adaptive-foreground.png", "size": (1024, 1024), "icon_fraction": 0.60, "has_background": False, "variant": "standard", "platform": "android"},
    {"name": "adaptive-background.png", "size": (1024, 1024), "icon_fraction": 1.0, "has_background": True, "variant": "background", "platform": "android"},
    {"name": "adaptive-monochrome.png", "size": (1024, 1024), "icon_fraction": 0.60, "has_background": False, "variant": "monochrome", "platform": "android"},
    # --- Splash ---
    {"name": "splash.png", "size": (1284, 2778), "icon_fraction": 0.33, "has_background": True, "variant": "standard", "platform": "general"},
    {"name": "splash-icon.png", "size": (1024, 1024), "icon_fraction": 0.70, "has_background": False, "variant": "standard", "platform": "general"},
    # --- Web ---
    {"name": "favicon.png", "size": (48, 48), "icon_fraction": 0.84, "has_background": False, "variant": "standard", "platform": "web"},
]


def _tight_crop_rgba(image: Image.Image, alpha_threshold: int = 10) -> Image.Image:
    """Crop to visible content using alpha channel.

    Pixels with alpha <= *alpha_threshold* are ignored so that stray
    near-invisible artifacts from AI generators don't skew the bounding box.
    """
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    mask = alpha.point(lambda p: 255 if p > alpha_threshold else 0)
    bbox = mask.getbbox()
    if not bbox:
        return rgba
    return rgba.crop(bbox)


def _crop_and_resize_icon(
    canvas_size: tuple[int, int],
    icon: Image.Image,
    icon_fraction: float,
) -> tuple[Image.Image, tuple[int, int]]:
    """Tight-crop and resize an icon to fit *icon_fraction* of canvas.

    Returns (resized_icon_rgba, (paste_x, paste_y)).
    """
    target_w, target_h = canvas_size
    cropped = _tight_crop_rgba(icon)
    src_w, src_h = cropped.size

    max_icon_side = max(1, int(min(target_w, target_h) * icon_fraction))
    scale = min(max_icon_side / src_w, max_icon_side / src_h)
    resized = cropped.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)

    x = (target_w - resized.width) // 2
    y = (target_h - resized.height) // 2
    return resized, (x, y)


def _place_icon_centered(
    canvas: Image.Image,
    icon: Image.Image,
    icon_fraction: float,
) -> Image.Image:
    """Place icon centered on an existing canvas."""
    resized, (x, y) = _crop_and_resize_icon(canvas.size, icon, icon_fraction)
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


def _make_ios_dark(
    size: tuple[int, int],
    bg_config: dict,
    source: Image.Image,
    icon_fraction: float,
) -> Image.Image:
    """Create iOS dark variant: dark bg with user's background visible through the logo shape."""
    dark_r, dark_g, dark_b = parse_hex(IOS_DARK_BG)
    dark_canvas = Image.new("RGBA", size, (dark_r, dark_g, dark_b, 255))

    user_bg = create_background(size, bg_config, source=source)

    resized_icon, (paste_x, paste_y) = _crop_and_resize_icon(size, source, icon_fraction)
    icon_alpha = resized_icon.getchannel("A")

    full_mask = Image.new("L", size, 0)
    full_mask.paste(icon_alpha, (paste_x, paste_y))

    return Image.composite(user_bg, dark_canvas, full_mask)


def _make_ios_tinted(
    size: tuple[int, int],
    bg_config: dict,
    source: Image.Image,
    icon_fraction: float,
) -> Image.Image:
    """Create iOS tinted variant: dark bg with grayscale background visible through the logo shape.

    The user's background (gradient/solid/image) is converted to grayscale
    and masked through the logo, giving a monochrome gradient tint with depth.
    iOS applies a user-chosen tint color over this at runtime.
    """
    dark_r, dark_g, dark_b = parse_hex(IOS_DARK_BG)
    dark_canvas = Image.new("RGBA", size, (dark_r, dark_g, dark_b, 255))

    user_bg = create_background(size, bg_config, source=source)
    gray_bg = user_bg.convert("L").convert("RGBA")

    resized_icon, (paste_x, paste_y) = _crop_and_resize_icon(size, source, icon_fraction)
    icon_alpha = resized_icon.getchannel("A")

    full_mask = Image.new("L", size, 0)
    full_mask.paste(icon_alpha, (paste_x, paste_y))

    return Image.composite(gray_bg, dark_canvas, full_mask)


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
            canvas = _make_ios_dark(size, bg_config, source, asset["icon_fraction"])
        elif variant == "tinted":
            canvas = _make_ios_tinted(size, bg_config, source, asset["icon_fraction"])
        elif variant == "background":
            canvas = create_background(size, bg_config, source=source)
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
