"""OpenAI per-token pricing for cost computation.

Rates are per-token (USD). Source: OpenAI pricing page, April 2026. Update
when OpenAI changes pricing — cost_usd is computed at record time, so old
rows keep their original cost.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

# Per-token USD rates. Keyed by model, then by token kind.
# Token kinds: "input_text", "input_image", "output_image", "output_text".
_PRICING: dict[str, dict[str, float]] = {
    "gpt-image-1-mini": {
        "input_text": 2.00 / 1_000_000,
        "input_image": 2.50 / 1_000_000,
        "output_image": 8.00 / 1_000_000,
    },
    "gpt-image-1": {
        "input_text": 5.00 / 1_000_000,
        "input_image": 10.00 / 1_000_000,
        "output_image": 40.00 / 1_000_000,
    },
    "gpt-4o": {
        "input_text": 2.50 / 1_000_000,
        "output_text": 10.00 / 1_000_000,
        # When gpt-4o hosts the image_generation tool, image tokens are billed
        # at the underlying image model's rate. We approximate with gpt-image-1
        # since that's the non-mini default the tool selects today.
        "input_image": 10.00 / 1_000_000,
        "output_image": 40.00 / 1_000_000,
    },
}


@dataclass(frozen=True)
class UsageBreakdown:
    """Normalized token usage + cost for one OpenAI call."""
    model: str
    input_text_tokens: int = 0
    input_image_tokens: int = 0
    output_image_tokens: int = 0
    cost_usd: float | None = None


def _rate(model: str, kind: str) -> float | None:
    return _PRICING.get(model, {}).get(kind)


def compute_cost(
    model: str,
    *,
    input_text_tokens: int = 0,
    input_image_tokens: int = 0,
    output_image_tokens: int = 0,
    output_text_tokens: int = 0,
) -> float | None:
    """Compute USD cost from token counts. Returns None if the model is unknown."""
    rates = _PRICING.get(model)
    if not rates:
        return None
    cost = 0.0
    cost += input_text_tokens * rates.get("input_text", 0.0)
    cost += input_image_tokens * rates.get("input_image", 0.0)
    cost += output_image_tokens * rates.get("output_image", 0.0)
    cost += output_text_tokens * rates.get("output_text", 0.0)
    return round(cost, 6)


def extract_usage(response: Any, *, fallback_model: str) -> UsageBreakdown:
    """Pull a normalized UsageBreakdown out of any OpenAI response object.

    Handles both the images.generate response shape and the responses.create
    shape. Unknown fields default to 0 so cost is at worst undercounted, never
    a crash.
    """
    model = getattr(response, "model", None) or fallback_model

    usage = getattr(response, "usage", None)
    input_text = _get_detail(usage, "input_tokens_details", "text_tokens", default=0)
    input_image = _get_detail(usage, "input_tokens_details", "image_tokens", default=0)
    # The images API puts the image count in output_tokens; the responses API
    # with the image_generation tool also reports it there.
    output_image = _get(usage, "output_tokens", default=0)

    # If details aren't present but we have a flat input_tokens, assume text.
    if input_text == 0 and input_image == 0:
        input_text = _get(usage, "input_tokens", default=0)

    cost = compute_cost(
        model,
        input_text_tokens=input_text,
        input_image_tokens=input_image,
        output_image_tokens=output_image,
    )
    return UsageBreakdown(
        model=model,
        input_text_tokens=input_text,
        input_image_tokens=input_image,
        output_image_tokens=output_image,
        cost_usd=cost,
    )


def _get(obj: Any, name: str, *, default: int = 0) -> int:
    if obj is None:
        return default
    val = getattr(obj, name, None)
    if val is None and isinstance(obj, dict):
        val = obj.get(name)
    return int(val) if val is not None else default


def _get_detail(obj: Any, outer: str, inner: str, *, default: int = 0) -> int:
    if obj is None:
        return default
    nested = getattr(obj, outer, None)
    if nested is None and isinstance(obj, dict):
        nested = obj.get(outer)
    if nested is None:
        return default
    val = getattr(nested, inner, None)
    if val is None and isinstance(nested, dict):
        val = nested.get(inner)
    return int(val) if val is not None else default
