"""Exception handlers for the FastAPI app."""

from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from openai import (
    APIConnectionError,
    APIError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    PermissionDeniedError,
    RateLimitError,
)


def _error_code(exc: APIError) -> str | None:
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict):
            code = err.get("code")
            if isinstance(code, str):
                return code
    return None


def _error_message(exc: APIError) -> str:
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict):
            msg = err.get("message")
            if isinstance(msg, str) and msg:
                return msg
    return str(exc)


async def openai_exception_handler(request: Request, exc: APIError) -> JSONResponse:
    """Translate OpenAI SDK errors into user-friendly HTTP responses."""
    if isinstance(exc, (AuthenticationError, PermissionDeniedError)):
        return JSONResponse(
            status_code=503,
            content={"detail": "The AI service is not configured correctly. Please contact the administrator."},
        )

    if isinstance(exc, RateLimitError):
        return JSONResponse(
            status_code=429,
            content={"detail": "The AI service is busy. Please try again in a few seconds."},
        )

    if isinstance(exc, BadRequestError):
        code = _error_code(exc)
        if code == "billing_hard_limit_reached":
            return JSONResponse(
                status_code=503,
                content={"detail": "The AI service has hit its billing limit. Please try again later or contact the administrator."},
            )
        if code in {"content_policy_violation", "moderation_blocked"}:
            return JSONResponse(
                status_code=400,
                content={"detail": "Your request was rejected by the content policy. Try rephrasing."},
            )
        return JSONResponse(
            status_code=400,
            content={"detail": _error_message(exc)},
        )

    if isinstance(exc, (APIConnectionError, APITimeoutError)):
        return JSONResponse(
            status_code=503,
            content={"detail": "Couldn't reach the AI service. Please try again."},
        )

    if isinstance(exc, InternalServerError):
        return JSONResponse(
            status_code=503,
            content={"detail": "The AI service is experiencing issues. Please try again shortly."},
        )

    return JSONResponse(status_code=503, content={"detail": str(exc)})
