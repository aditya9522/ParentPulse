# backend/app/helpers/response_builder.py
import uuid
from typing import Any, Optional
from app.core.logging import correlation_id_ctx
from app.schemas.common import ApiResponse, ResponseMeta, PaginationMeta


def build_response(
    data: Any,
    pagination: Optional[PaginationMeta] = None,
    request_id: Optional[str] = None,
) -> ApiResponse[Any]:
    req_id = request_id or correlation_id_ctx.get()
    if not req_id or req_id == "system":
        req_id = str(uuid.uuid4())

    meta = ResponseMeta(
        request_id=req_id,
        pagination=pagination,
    )
    return ApiResponse(data=data, meta=meta)
