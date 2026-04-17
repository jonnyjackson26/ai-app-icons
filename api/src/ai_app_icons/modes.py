"""Icon-generation style modes.

Single source of truth for the visual styles the user can pick from.
Each mode owns a ``style_block`` that is injected into
``_ICON_PROMPT_TEMPLATE`` in :mod:`ai_app_icons.icon_gen` — it replaces the
lines that describe the visual treatment (shape style, palette size,
flatness). Invariants (transparent background, 48px recognizability, no
text, no border, padding, centered symbol) stay in the template.

The frontend mirrors ``id``, ``name`` and ``description`` in
``web/src/lib/generationModes.ts`` for display only. If you add or rename
a mode here, update that file too.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Mode:
    id: str
    name: str
    description: str
    style_block: str


MODES: dict[str, Mode] = {
    "flat": Mode(
        id="flat",
        name="Flat",
        description="Bold geometric shapes, solid colors, no shadows.",
        style_block=(
            "- Clean, modern flat-design style (think iOS or Material You app icons).\n"
            "- Bold, simple geometric shapes with a clear silhouette.\n"
            "- Vibrant yet professional palette with 3-4 colors and strong contrast.\n"
            "- Solid fills — no shadows, highlights, or gradients."
        ),
    ),
    "ios-liquid-glass": Mode(
        id="ios-liquid-glass",
        name="iOS Liquid Glass",
        description="Glossy translucent material with soft refraction.",
        style_block=(
            "- iOS 'Liquid Glass' style: glossy, translucent material with soft refraction and specular highlights.\n"
            "- A crisp central symbol floats on top of (or inside) a frosted glass layer with subtle edge-lighting.\n"
            "- Cool muted palette with silver/blue accents; gentle gradients allowed to convey glass depth."
        ),
    ),
    "skeuomorphic": Mode(
        id="skeuomorphic",
        name="Skeuomorphic",
        description="Realistic textures, lighting, and materials (iOS 6 era).",
        style_block=(
            "- Skeuomorphic style: render the symbol as a real physical object (leather, metal, wood, paper, fabric, etc.).\n"
            "- Rich textures, realistic lighting, drop shadows, inner bevels, and subtle gradients.\n"
            "- Saturated, warm palette; shading and highlights are essential to the look."
        ),
    ),
    "minimal": Mode(
        id="minimal",
        name="Minimal",
        description="Single clean symbol, monochrome, lots of negative space.",
        style_block=(
            "- Minimal style: a single clean symbol built from 1-2 stroke weights or simple solid shapes.\n"
            "- Monochrome or two-color palette with abundant negative space.\n"
            "- No shadows, gradients, or ornamentation."
        ),
    ),
    "illustrative": Mode(
        id="illustrative",
        name="Illustrative",
        description="Warm hand-drawn look with organic shapes and texture.",
        style_block=(
            "- Illustrative style: warm, hand-drawn look with organic shapes and subtle paper/brush texture.\n"
            "- Painterly color blends and soft outlines; friendly and editorial.\n"
            "- 4-6 harmonious colors with playful character."
        ),
    ),
    "3d": Mode(
        id="3d",
        name="3D",
        description="Rendered 3D object with soft lighting and depth.",
        style_block=(
            "- Rendered in a modern 3D style: smooth extruded geometry with soft global illumination.\n"
            "- Glossy or matte surfaces with realistic shading and ambient occlusion.\n"
            "- Hero central object, slight perspective or isometric view; gradient shading expected."
        ),
    ),
}

DEFAULT_MODE_ID = "flat"


def get_mode(mode_id: str | None) -> Mode:
    """Look up a Mode by id. ``None`` returns the default mode."""
    if not mode_id:
        return MODES[DEFAULT_MODE_ID]
    if mode_id not in MODES:
        raise ValueError(
            f"Unknown mode: {mode_id!r}. Valid modes: {sorted(MODES)}"
        )
    return MODES[mode_id]
