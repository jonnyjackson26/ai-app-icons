"""FastAPI application for AI App Icons."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError

from ai_app_icons import __version__

from .error_handlers import openai_exception_handler
from .routes import router


def _init_sentry() -> None:
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return
    try:
        import sentry_sdk
    except ImportError:
        return
    sentry_sdk.init(
        dsn=dsn,
        environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
        release=__version__,
        send_default_pii=True,
        enable_logs=True,
        traces_sample_rate=1.0,
        profile_session_sample_rate=1.0,
        profile_lifecycle="trace",
    )


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    _init_sentry()
    app = FastAPI(
        title="AI App Icons",
        description=(
            "Generate mobile app icon assets using AI. "
            "Describe your icon, generate it, refine it, and export all asset sizes."
        ),
        version=__version__,
    )

    # CORS — allow the web frontend (and localhost during dev) to call the API.
    # Set ALLOWED_ORIGINS env var to a comma-separated list of origins in production.
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    app.add_exception_handler(APIError, openai_exception_handler)
    return app


app = create_app()
