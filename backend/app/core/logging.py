# backend/app/core/logging.py
import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

# Context variable for tracing request / correlation IDs
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="system")


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": correlation_id_ctx.get(),
        }
        if hasattr(record, "props") and isinstance(record.props, dict):  # type: ignore
            log_record.update(record.props)  # type: ignore

        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_record)


def setup_logging(debug: bool = False) -> logging.Logger:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger("parentpulse")
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)
    root_logger.handlers = [handler]
    root_logger.propagate = False

    return root_logger


logger = logging.getLogger("parentpulse")
