# backend/app/clients/upstash.py
from typing import Optional, Any
import json
from app.core.config import get_settings
from app.core.logging import logger

try:
    from upstash_redis.asyncio import Redis as UpstashRedis
except ImportError:
    UpstashRedis = None  # type: ignore

_redis_client: Optional[Any] = None
_in_memory_cache: dict[str, Any] = {}


def get_redis_client() -> Optional[Any]:
    global _redis_client
    if _redis_client is None and UpstashRedis is not None:
        settings = get_settings()
        if "mock" not in settings.upstash_redis_rest_url:
            try:
                _redis_client = UpstashRedis(
                    url=settings.upstash_redis_rest_url,
                    token=settings.upstash_redis_rest_token.get_secret_value(),
                )
            except Exception as e:
                logger.warning(f"Upstash Redis initialization failed: {e}")
    return _redis_client


async def cache_get(key: str) -> Optional[Any]:
    client = get_redis_client()
    if client:
        try:
            val = await client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.warning(f"Cache get error for key '{key}': {e}")
    return _in_memory_cache.get(key)


async def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    client = get_redis_client()
    if client:
        try:
            await client.set(key, json.dumps(value), ex=ttl_seconds)
            return
        except Exception as e:
            logger.warning(f"Cache set error for key '{key}': {e}")
    _in_memory_cache[key] = value


async def cache_delete(key: str) -> None:
    client = get_redis_client()
    if client:
        try:
            await client.delete(key)
        except Exception:
            pass
    _in_memory_cache.pop(key, None)
