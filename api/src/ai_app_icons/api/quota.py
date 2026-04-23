"""Quota enforcement for OpenAI-backed endpoints.

One `usage_events` row per successful generate/edit call. Rolling 7-day window
per user. Self-host users (source='self_host') bypass entirely.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status

from ai_app_icons.pricing import UsageBreakdown

from .auth import User, get_current_user
from .supabase_client import get_service_client

logger = logging.getLogger(__name__)

# Rolling 7-day window.
WINDOW_DAYS = 7

# Per-tier caps for successful OpenAI calls (generate + edit combined).
TIER_LIMITS: dict[str, int | None] = {
    "free": 5,
    "pro": 100,
    "unlimited": None,  # no cap
}


def _limit_for(tier: str) -> int | None:
    return TIER_LIMITS.get(tier, TIER_LIMITS["free"])


def _window_start_iso() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=WINDOW_DAYS)).isoformat()


async def check_quota(user: User = Depends(get_current_user)) -> User:
    """Raises 429 if the user has exhausted their rolling-window cap.

    Self-host bypass: if SUPABASE_URL is unset, user.source == 'self_host' and
    the limit is None, so this is a no-op.
    """
    if user.source == "self_host":
        return user

    limit = _limit_for(user.tier)
    if limit is None:
        logger.info("[quota] user=%s tier=%s — unlimited", user.id, user.tier)
        return user

    client = get_service_client()
    res = (
        client.table("usage_events")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .gte("created_at", _window_start_iso())
        .execute()
    )
    used = res.count or 0
    logger.info(
        "[quota] user=%s tier=%s used=%d/%d (7d)", user.id, user.tier, used, limit
    )

    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "quota_exceeded",
                "limit": limit,
                "used": used,
                "window_days": WINDOW_DAYS,
                "tier": user.tier,
            },
        )
    return user


def record_usage(
    user: User, kind: str, usage: UsageBreakdown | None = None
) -> None:
    """Record a successful OpenAI call. Swallows errors — metering must never
    block the user's response.

    When ``usage`` is provided, token counts and computed cost_usd are stored
    alongside the event. Callers should pass the UsageBreakdown returned by
    ``generate_icon`` / ``edit_icon``.
    """
    if user.source == "self_host":
        return
    if kind not in ("generate", "edit"):
        return
    if not os.getenv("SUPABASE_URL"):
        return
    row: dict[str, object] = {"user_id": user.id, "kind": kind}
    if usage is not None:
        row.update(
            model=usage.model,
            input_text_tokens=usage.input_text_tokens,
            input_image_tokens=usage.input_image_tokens,
            output_image_tokens=usage.output_image_tokens,
            cost_usd=usage.cost_usd,
        )
    try:
        get_service_client().table("usage_events").insert(row).execute()
    except Exception:
        logger.exception("Failed to record usage_event (user=%s kind=%s)", user.id, kind)
