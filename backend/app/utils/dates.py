# backend/app/utils/dates.py
from datetime import datetime, timezone, date
from typing import Optional


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def format_iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def parse_date_str(date_str: str) -> Optional[date]:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None
