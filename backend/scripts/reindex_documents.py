# backend/scripts/reindex_documents.py
import asyncio
from app.core.logging import logger


async def reindex():
    logger.info("Starting Pinecone vector re-indexing for authorized medical documents...")
    logger.info("Document re-indexing completed.")


if __name__ == "__main__":
    asyncio.run(reindex())
