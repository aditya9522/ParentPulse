# backend/app/helpers/pagination.py
import math
from typing import Sequence, TypeVar, Tuple
from app.schemas.common import PaginationMeta

T = TypeVar("T")


def paginate_sequence(
    items: Sequence[T],
    page: int = 1,
    per_page: int = 20,
) -> Tuple[Sequence[T], PaginationMeta]:
    total_items = len(items)
    total_pages = math.ceil(total_items / per_page) if total_items > 0 else 0
    start = (page - 1) * per_page
    end = start + per_page
    paginated_items = items[start:end]

    meta = PaginationMeta(
        page=page,
        per_page=per_page,
        total_items=total_items,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )
    return paginated_items, meta
