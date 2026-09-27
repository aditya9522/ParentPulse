# backend/app/middleware/error_handler.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.exceptions import ParentPulseException
from app.core.logging import correlation_id_ctx, logger


async def parentpulse_exception_handler(request: Request, exc: ParentPulseException) -> JSONResponse:
    request_id = correlation_id_ctx.get()
    logger.warning(
        f"Handled application exception [{exc.code}] on {request.method} {request.url.path}: {exc.message}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details if exc.details else None,
                "request_id": request_id,
            }
        },
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = correlation_id_ctx.get()
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later.",
                "details": None,
                "request_id": request_id,
            }
        },
    )
