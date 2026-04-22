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
            "- The SUBJECT is sculpted from Apple's Liquid Glass (iOS 26 / macOS Tahoe design language): a translucent, refractive material that behaves like a polished piece of optical glass. The symbol itself IS the glass object — not a flat symbol printed on a glass tile.\n"
            "- The body is glossy and softly luminous: gentle internal gradients, faint caustics, and subtle refraction suggest light passing through and bending inside the volume. Colors inside the glass glow rather than appear flat or neon. Prefer cool, muted palettes — silvery whites, pale blues, soft tints — and let translucency and gradient carry the color, not heavy saturation.\n"
            "- Crisp specular highlights trace the upper edges and curved surfaces as thin, bright ribbons of light from a single overhead source. Edges lens the light the way the rim of real glass does. Keep highlights clean and the silhouette bold so the shape stays legible at small sizes.\n"
            "- No frame and no environment around the subject. Do NOT render a frosted rounded-square tile, squircle, panel, studio backdrop, or wallpaper behind the glass object, and do NOT bake in heavy drop shadows, chunky bevels, or thick outlines (the system adds its own lighting at render time). A very subtle contact shadow directly beneath the floating object is fine; every other pixel is transparent."
        ),
    ),
    "single-color": Mode(
        id="single-color",
        name="Single Color",
        description="One-color silhouette on transparent background.",
        style_block=(
            "- Single-color artwork: the entire symbol is rendered in exactly ONE solid color against the transparent background.\n"
            "- No gradients, no shading, no secondary colors, no outlines in a different color — just one flat fill shaping the silhouette.\n"
            "- The shape must remain legible from its silhouette alone; rely on clean geometry and confident negative space.\n"
            "- Do not render any rounded-square tile, circle, or colored backdrop behind the symbol; surrounding pixels stay transparent."
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
