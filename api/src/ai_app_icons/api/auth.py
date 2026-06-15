"""Auth dependency for FastAPI routes.

Two credential types are accepted on the `Authorization: Bearer` header:

* A Supabase JWT — used by the browser wizard, which proxies the user's
  Supabase session.
* A personal API key (prefix ``cak_``) — used by the CLI's non-interactive
  ``--ai`` mode. Keys are minted in the web dashboard and stored hashed in the
  ``api_keys`` table; we look them up by sha256 here.

When SUPABASE_URL is unset, returns a synthetic self-host user that downstream
quota checks treat as unlimited. This is the escape hatch for OSS self-hosters.
"""

from __future__ import annotations

import hashlib
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
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
    source: str  # 'jwt' | 'api_key' | 'self_host'


API_KEY_PREFIX = "cak_"


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


def _verify_api_key(token: str) -> User:
    """Resolve a CLI API key (``cak_...``) to a User via the api_keys table.

    Looks the key up by sha256 hash among non-revoked rows. Raises 401 for an
    unknown/revoked key, 503 if the lookup itself fails (so a Supabase outage
    doesn't masquerade as a bad key).
    """
    key_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    client = get_service_client()
    try:
        res = (
            client.table("api_keys")
            .select("id, user_id")
            .eq("key_hash", key_hash)
            .is_("revoked_at", "null")
            .limit(1)
            .execute()
        )
    except Exception:
        logger.exception("[auth] api_key lookup failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable; try again shortly.",
        )

    rows = res.data or []
    if not rows:
        raise _unauthorized("Invalid or revoked API key.")
    row = rows[0]
    user_id = row["user_id"]

    # Best-effort timestamp so the dashboard can show "last used"; never block
    # the request on it.
    try:
        client.table("api_keys").update(
            {"last_used_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", row["id"]).execute()
    except Exception:
        logger.warning("[auth] failed to touch api_key.last_used_at", exc_info=True)

    profile = _fetch_profile(user_id)
    user = User(
        id=user_id,
        email=None,
        tier=profile.get("tier", "free"),
        source="api_key",
    )
    logger.info("[auth] api_key user=%s tier=%s", user.id, user.tier)
    return user


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

    if token.startswith(API_KEY_PREFIX):
        return _verify_api_key(token)

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
