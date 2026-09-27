# backend/app/middleware/correlation_id.py
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import correlation_id_ctx

HEADER_NAME = "X-Correlation-ID"


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        corr_id = request.headers.get(HEADER_NAME, str(uuid.uuid4()))
        token = correlation_id_ctx.set(corr_id)
        try:
            response = await call_next(request)
            response.headers[HEADER_NAME] = corr_id
            return response
        finally:
            correlation_id_ctx.reset(token)
