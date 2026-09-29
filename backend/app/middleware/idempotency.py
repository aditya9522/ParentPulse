import hashlib
import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.exceptions import AuthenticationError
from app.core.logging import logger
from app.core.security import verify_access_token
from app.db.session import AsyncSessionFactory


class IdempotencyMiddleware(BaseHTTPMiddleware):
    """Guarantee one durable result for retried authenticated mutations."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_key = request.headers.get("Idempotency-Key")
        if request.method not in {"POST", "PATCH", "DELETE"} or not request_key:
            return await call_next(request)
        if len(request_key) > 200:
            return JSONResponse(status_code=400, content={"error": {"code": "INVALID_IDEMPOTENCY_KEY", "message": "Idempotency key is too long."}})

        authorization = request.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            return await call_next(request)
        try:
            payload = await verify_access_token(authorization.removeprefix("Bearer ").strip())
            user_id = UUID(payload["sub"])
        except (AuthenticationError, KeyError, TypeError, ValueError) as exc:
            logger.warning(f"Idempotency authentication deferred to endpoint: {exc}")
            return await call_next(request)

        body = await request.body()
        request_hash = hashlib.sha256(
            request.method.encode()
            + b"\n"
            + request.url.path.encode()
            + b"?"
            + request.url.query.encode()
            + b"\n"
            + body
        ).hexdigest()
        now = datetime.now(UTC)

        try:
            async with AsyncSessionFactory() as session:
                existing = (await session.execute(
                    text("""
                        SELECT request_hash, state, response_status, response_body, expires_at
                        FROM idempotency_records
                        WHERE user_id = :user_id AND request_key = :request_key
                    """),
                    {"user_id": user_id, "request_key": request_key},
                )).mappings().one_or_none()

                if existing and existing["expires_at"] <= now:
                    await session.execute(
                        text("DELETE FROM idempotency_records WHERE user_id = :user_id AND request_key = :request_key"),
                        {"user_id": user_id, "request_key": request_key},
                    )
                    await session.commit()
                    existing = None

                if existing:
                    if existing["request_hash"] != request_hash:
                        return JSONResponse(status_code=409, content={"error": {"code": "IDEMPOTENCY_KEY_REUSED", "message": "This sync key was already used for a different change."}})
                    if existing["state"] == "completed":
                        return JSONResponse(
                            status_code=existing["response_status"],
                            content=existing["response_body"],
                            headers={"X-Idempotent-Replay": "true"},
                        )
                    return JSONResponse(status_code=425, content={"error": {"code": "REQUEST_IN_PROGRESS", "message": "This change is already being processed. Retry shortly."}})

                reservation = await session.execute(
                    text("""
                        INSERT INTO idempotency_records
                            (user_id, request_key, request_hash, state, created_at, expires_at)
                        VALUES
                            (:user_id, :request_key, :request_hash, 'processing', :now, :expires_at)
                        ON CONFLICT (user_id, request_key) DO NOTHING
                        RETURNING request_key
                    """),
                    {
                        "user_id": user_id,
                        "request_key": request_key,
                        "request_hash": request_hash,
                        "now": now,
                        "expires_at": now + timedelta(minutes=2),
                    },
                )
                await session.commit()
                if reservation.scalar_one_or_none() is None:
                    return JSONResponse(status_code=425, content={"error": {"code": "REQUEST_IN_PROGRESS", "message": "This change is already being processed. Retry shortly."}})
        except Exception as exc:  # noqa: BLE001 - database/provider boundary
            logger.error(f"Idempotency store unavailable: {exc}", exc_info=True)
            return JSONResponse(
                status_code=503,
                content={
                    "error": {
                        "code": "SYNC_SAFETY_UNAVAILABLE",
                        "message": "Safe write synchronization is temporarily unavailable. No change was applied; retry shortly.",
                    }
                },
            )

        response = await call_next(request)
        response_body = b"".join([chunk async for chunk in response.body_iterator])
        replayable = 200 <= response.status_code < 300
        try:
            async with AsyncSessionFactory() as session:
                if replayable:
                    parsed_body = json.loads(response_body.decode("utf-8"))
                    await session.execute(
                        text("""
                            UPDATE idempotency_records
                            SET state = 'completed', response_status = :status,
                                response_body = CAST(:body AS jsonb), expires_at = :expires_at
                            WHERE user_id = :user_id AND request_key = :request_key
                        """),
                        {
                            "status": response.status_code,
                            "body": json.dumps(parsed_body),
                            "expires_at": datetime.now(UTC) + timedelta(hours=24),
                            "user_id": user_id,
                            "request_key": request_key,
                        },
                    )
                else:
                    await session.execute(
                        text("DELETE FROM idempotency_records WHERE user_id = :user_id AND request_key = :request_key"),
                        {"user_id": user_id, "request_key": request_key},
                    )
                await session.commit()
        except Exception as exc:  # noqa: BLE001 - the primary mutation already succeeded
            logger.error(f"Could not finalize idempotency record: {exc}", exc_info=True)

        headers = dict(response.headers)
        headers.pop("content-length", None)
        return Response(
            content=response_body,
            status_code=response.status_code,
            headers=headers,
            media_type=response.media_type,
        )
