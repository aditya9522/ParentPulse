# backend/app/workers/embedding_worker.py
from app.core.logging import logger


async def reindex_embeddings_job(parent_id: str) -> None:
    logger.info(f"Background worker reindexing Pinecone vector embeddings for parent {parent_id}")
