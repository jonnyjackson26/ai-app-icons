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
            "- Flat-design artwork: bold, simple geometric shapes with a confident silhouette.\n"
            "- Vibrant yet professional 3-4 color palette with strong contrast.\n"
            "- Solid fills only — no shadows, highlights, gradients, or bevels.\n"
            "- Style the SYMBOL itself this way. Do not render a flat-colored rounded-square tile behind it; surrounding pixels stay transparent."
        ),
    ),
    "ios-liquid-glass": Mode(
        id="ios-liquid-glass",
        name="iOS Liquid Glass",
        description="Glossy translucent material with soft refraction.",
        style_block=(
            "- The SUBJECT is sculpted from liquid glass: glossy, translucent material with soft refraction, gentle caustics, and crisp specular highlights along its edges.\n"
            "- Subtle gradients across the glass surface are expected; a faint contact shadow directly under the floating glass object is fine.\n"
            "- Cool muted palette with silver / blue accents inside the glass.\n"
            "- The glass IS the subject, not a frame around it. Do NOT draw a frosted rounded-square tile with a symbol inside — the symbol itself is the glass object, floating on transparent pixels."
        ),
    ),
    "skeuomorphic": Mode(
        id="skeuomorphic",
        name="Skeuomorphic",
        description="Realistic textures, lighting, and materials (iOS 6 era).",
        style_block=(
            "- Skeuomorphic: render the symbol as a real physical object (leather, metal, wood, paper, fabric, glass, etc.) that could sit on a table.\n"
            "- Rich material textures, realistic lighting, drop shadows, inner bevels, and subtle gradients live on the OBJECT's own surfaces.\n"
            "- Saturated, warm palette; shading and highlights are essential.\n"
            "- Do not wrap the object in a textured rounded-square tile. The texture belongs to the object; everything outside the object is transparent."
        ),
    ),
    "minimal": Mode(
        id="minimal",
        name="Minimal",
        description="Single clean symbol, monochrome, lots of negative space.",
        style_block=(
            "- Minimal: a single clean symbol built from 1-2 stroke weights or simple solid shapes.\n"
            "- Monochrome or two-color palette.\n"
            "- No shadows, gradients, or ornamentation.\n"
            "- The negative space around the symbol IS the transparent background — do not draw a visible rectangle, circle, or colored field behind it."
        ),
    ),
    "illustrative": Mode(
        id="illustrative",
        name="Illustrative",
        description="Warm hand-drawn look with organic shapes and texture.",
        style_block=(
            "- Illustrative: a warm, hand-drawn-feeling subject with organic shapes and subtle paper / brush / grain texture on the subject's own surfaces.\n"
            "- Painterly color blends and soft outlines; friendly and editorial.\n"
            "- 4-6 harmonious colors with playful character.\n"
            "- Texture and brushwork belong to the subject. Do not paint a textured square or rounded-rectangle panel behind the subject — surrounding pixels stay transparent."
        ),
    ),
    "3d": Mode(
        id="3d",
        name="3D",
        description="Rendered 3D object with soft lighting and depth.",
        style_block=(
            "- A modern 3D render: smooth extruded geometry with soft global illumination.\n"
            "- Glossy or matte surfaces with realistic shading and ambient occlusion.\n"
            "- A hero central object seen in slight perspective or isometric view; gradient shading on the object is expected.\n"
            "- A subtle contact shadow directly beneath the object is OK, but no rendered ground plane, no studio backdrop, no environment — just the object floating on transparent pixels."
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
