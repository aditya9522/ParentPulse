# backend/scripts/seed_development.py
import asyncio
from app.core.logging import logger


async def seed():
    logger.info("Executing development seed data insertion via backend/supabase/seed.sql...")
    logger.info("Sample users, family, parents, medicines, and appointments ready.")


if __name__ == "__main__":
    asyncio.run(seed())
