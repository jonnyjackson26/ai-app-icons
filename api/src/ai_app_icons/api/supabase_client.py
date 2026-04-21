"""Lazy singleton for the Supabase service-role client.

Only instantiated when SUPABASE_URL is set — keeps self-host mode free of the
dependency at runtime (the import still happens, but the client is never built).
"""

from __future__ import annotations

import os
from functools import lru_cache

from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_service_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SECRET_KEY must be set to use Supabase features."
        )
    return create_client(url, key)
