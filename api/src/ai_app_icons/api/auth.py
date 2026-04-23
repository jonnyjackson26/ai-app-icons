"""Auth dependency for FastAPI routes.

Verifies a Supabase JWT on every authed request. CLI callers don't hit the
API directly — they proxy through the browser wizard, which uses the user's
Supabase session. So there's no CLI-token path here.

When SUPABASE_URL is unset, returns a synthetic self-host user that downstream
quota checks treat as unlimited. This is the escape hatch for OSS self-hosters.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, Header, HTTPException, status

from .supabase_client import get_service_client

logger = logging.getLogger(__name__)

SELF_HOST_USER_ID = "self-host"


@dataclass(frozen=True)
class User:
    id: str
    email: str | None
    tier: str
    source: str  # 'jwt' | 'self_host'


def _auth_enabled() -> bool:
    return bool(os.getenv("SUPABASE_URL"))


def _self_host_user() -> User:
    return User(id=SELF_HOST_USER_ID, email=None, tier="unlimited", source="self_host")


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient:
    url = os.environ["SUPABASE_URL"].rstrip("/")
    return jwt.PyJWKClient(f"{url}/auth/v1/.well-known/jwks.json")


def _verify_supabase_jwt(token: str) -> dict[str, Any]:
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "HS256")

    if alg == "HS256":
        secret = os.getenv("SUPABASE_JWT_SECRET")
        if not secret:
            raise _unauthorized("Server missing SUPABASE_JWT_SECRET; cannot verify HS256 token.")
        try:
            return jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"require": ["sub", "exp"]},
            )
        except jwt.PyJWTError as e:
            raise _unauthorized(f"Invalid token: {e}")

    # Asymmetric (RS256/ES256) via JWKS.
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            signing_key,
            algorithms=[alg],
            audience="authenticated",
            options={"require": ["sub", "exp"]},
        )
    except jwt.PyJWTError as e:
        raise _unauthorized(f"Invalid token: {e}")


def _fetch_profile(user_id: str) -> dict[str, Any]:
    # Raises on infrastructure failures so a Supabase outage surfaces as 503
    # instead of silently downgrading every signed-in user to the free tier.
    # An empty result set (user has no profile row yet) still means "free" —
    # that's the legitimate new-user case.
    try:
        res = (
            get_service_client()
            .table("profiles")
            .select("tier, subscription_status, current_period_end")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:
        logger.exception("[auth] profile fetch failed for user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Profile service unavailable; try again shortly.",
        )
    rows = res.data or []
    if rows:
        return rows[0]
    return {"tier": "free"}


async def get_current_user(
    authorization: str | None = Header(default=None),
) -> User:
    if not _auth_enabled():
        logger.info("[auth] SUPABASE_URL unset — self-host bypass")
        return _self_host_user()

    if not authorization or not authorization.lower().startswith("bearer "):
        logger.info("[auth] missing bearer header")
        raise _unauthorized("Missing bearer token.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise _unauthorized("Empty bearer token.")

    logger.info(
        "[auth] bearer received: prefix=%s... len=%d", token[:12], len(token)
    )

    claims = _verify_supabase_jwt(token)
    user_id = claims.get("sub")
    if not user_id:
        raise _unauthorized("Token missing subject.")

    profile = _fetch_profile(user_id)
    user = User(
        id=user_id,
        email=claims.get("email"),
        tier=profile.get("tier", "free"),
        source="jwt",
    )
    logger.info("[auth] jwt user=%s email=%s tier=%s", user.id, user.email, user.tier)
    return user


CurrentUser = Depends(get_current_user)


def auth_required() -> bool:
    return _auth_enabled()
