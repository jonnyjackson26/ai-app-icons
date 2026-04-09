"""FastAPI application for AI App Icons."""

from fastapi import FastAPI

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
    app.include_router(router)
    return app


app = create_app()
