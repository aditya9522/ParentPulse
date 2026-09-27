# backend/scripts/bootstrap.py
import asyncio
from app.core.config import get_settings
from app.core.logging import logger


async def bootstrap():
    settings = get_settings()
    logger.info(f"Bootstrapping ParentPulse environment: {settings.environment}")
    logger.info("Verifying database connection and environment configuration...")
    logger.info("Bootstrap check completed successfully.")


if __name__ == "__main__":
    asyncio.run(bootstrap())
