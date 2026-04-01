"""Generate app icons using OpenAI's image generation API (gpt-image-1)."""

from __future__ import annotations

import base64
import os
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

load_dotenv()

# --- Prompt engineering -------------------------------------------------------
# The meta-prompt wraps the user's plain-language app description into a
# detailed specification that reliably produces clean, professional app icons.
#
# Key design choices:
#   * Transparent background — lets the existing background system (auto, solid,
#     gradient, image) composite the icon onto styled canvases.
#   * "No text" rule — text becomes unreadable below ~128 px and looks bad on
#     app icons.  App-store guidelines discourage it too.
#   * "No rounded-rect frame" — iOS/Android add their own mask; baking one in
#     causes double-rounding artifacts.
#   * Emphasis on simplicity & silhouette — icons must read at 48 px (favicon).
#   * Flat style bias — gradients and 3D effects break down at small sizes and
#     clash with most OS design languages.

_ICON_PROMPT_TEMPLATE = """\
Create a mobile app icon for the following app:
{description}

Design requirements — follow every point:
1. A single, centered graphic element on a TRANSPARENT background.
2. Clean, modern flat-design style (think iOS / Material You app icons).
3. Bold, simple geometric shapes with a clear silhouette.
4. Must be clearly recognizable when displayed at 48 x 48 pixels.
5. Absolutely NO text, letters, numbers, or written words anywhere.
6. NO rounded-rectangle border, phone frame, or device mockup.
7. Vibrant yet professional color palette with strong contrast.
8. The symbol should intuitively represent the app's core purpose.
9. Use at most 3-4 colors to keep the design cohesive.
10. Generous padding around the symbol (leave ~15% margin on each side).
"""


def build_icon_prompt(description: str) -> str:
    """Wrap a plain-language app description into an optimised icon-gen prompt."""
    return _ICON_PROMPT_TEMPLATE.format(description=description.strip())


# --- API call -----------------------------------------------------------------

def generate_icon(
    description: str,
    *,
    model: str = "gpt-image-1",
    size: str = "1024x1024",
    output_path: Path | None = None,
) -> Image.Image:
    """Call OpenAI to generate an app icon and return it as a PIL Image (RGBA).

    Parameters
    ----------
    description:
        Plain-language description of the app (e.g. "track temple attendance").
    model:
        OpenAI image model to use.
    size:
        Image dimensions.  1024x1024 is ideal for app icons.
    output_path:
        If given, save the raw PNG here as well.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set.  "
            "Add it to a .env file or export it as an environment variable."
        )

    client = OpenAI(api_key=api_key)
    prompt = build_icon_prompt(description)

    result = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        background="transparent",
    )

    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_bytes)).convert("RGBA")

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(output_path, format="PNG")

    return image
