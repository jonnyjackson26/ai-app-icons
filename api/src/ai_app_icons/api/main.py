"""FastAPI application for AI App Icons."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_app_icons import __version__

from .routes import router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
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
    return app


app = create_app()
