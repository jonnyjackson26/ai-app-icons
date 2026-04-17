"""Generate and edit app icons using OpenAI's image API (gpt-image-1)."""

from __future__ import annotations

import base64
import os
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

from ai_app_icons.modes import get_mode

load_dotenv()

# --- Prompt templates ---------------------------------------------------------

_ICON_PROMPT_TEMPLATE = """\
Create a mobile app icon for the following app:
{description}

Design requirements — follow every point:
- A single, centered graphic element on a TRANSPARENT background.
{style_block}
- Must be clearly recognizable when displayed at 48 x 48 pixels.
- Absolutely NO text, letters, numbers, or written words anywhere.
- NO rounded-rectangle border, phone frame, or device mockup.
- The symbol should intuitively represent the app's core purpose.
- Generous padding around the symbol (leave ~15% margin on each side).
"""

_EDIT_PROMPT_TEMPLATE = """\
Edit this app icon. Make the following change and NOTHING else:
{instruction}

Keep the exact same style, composition, and layout for everything not \
mentioned. The background must remain transparent. No text or letters. \
No rounded-rectangle border."""


def build_icon_prompt(description: str, mode_id: str | None = None) -> str:
    """Wrap a plain-language app description into an optimised icon-gen prompt.

    ``mode_id`` selects a visual style from :mod:`ai_app_icons.modes`.
    Passing ``None`` uses the default mode (flat).
    """
    mode = get_mode(mode_id)
    return _ICON_PROMPT_TEMPLATE.format(
        description=description.strip(),
        style_block=mode.style_block,
    )


def _build_edit_prompt(instruction: str) -> str:
    """Build the edit instruction prompt."""
    return _EDIT_PROMPT_TEMPLATE.format(instruction=instruction.strip())


# --- Helpers ------------------------------------------------------------------

def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set.  "
            "Add it to a .env file or export it as an environment variable."
        )
    return OpenAI(api_key=api_key)


def _decode_image(result) -> Image.Image:
    """Decode a base64 image from an OpenAI API response."""
    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)
    return Image.open(BytesIO(image_bytes)).convert("RGBA")


# --- API calls ----------------------------------------------------------------

def generate_icon(
    description: str,
    *,
    model: str = "gpt-image-1",
    size: str = "1024x1024",
    output_path: Path | None = None,
    mode: str | None = None,
) -> Image.Image:
    """Generate a new app icon from a text description. Returns PIL Image (RGBA).

    ``mode`` selects a visual style (see :mod:`ai_app_icons.modes`).
    """
    client = _get_client()
    prompt = build_icon_prompt(description, mode)

    result = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        background="transparent",
    )

    image = _decode_image(result)

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(output_path, format="PNG")

    return image


def edit_icon(
    source: Image.Image,
    instruction: str,
    *,
    size: str = "1024x1024",
) -> tuple[Image.Image, str]:
    """Edit an existing icon based on a text instruction.

    Returns (image, message) — the edited PIL Image (RGBA) and any text the
    model included alongside the image.
    """
    client = _get_client()

    # Encode the current image as base64
    buf = BytesIO()
    source.save(buf, format="PNG")
    image_b64 = base64.b64encode(buf.getvalue()).decode()

    prompt = _build_edit_prompt(instruction)

    response = client.responses.create(
        model="gpt-4o",
        input=[{
            "role": "user",
            "content": [
                {
                    "type": "input_image",
                    "image_url": f"data:image/png;base64,{image_b64}",
                },
                {"type": "input_text", "text": prompt},
            ],
        }],
        tools=[{
            "type": "image_generation",
            "background": "transparent",
            "size": size,
        }],
    )

    # Extract image and text from the response
    image = None
    text_parts: list[str] = []

    for item in response.output:
        if item.type == "image_generation_call":
            image_bytes = base64.b64decode(item.result)
            image = Image.open(BytesIO(image_bytes)).convert("RGBA")
        elif item.type == "message" and hasattr(item, "content"):
            for block in item.content:
                if hasattr(block, "text"):
                    text_parts.append(block.text)

    if image is None:
        raise RuntimeError("The model did not generate an image. Try a different instruction.")

    return image, "\n".join(text_parts)
