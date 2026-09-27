# backend/app/clients/pinecone.py
from typing import Any, List, Optional
from app.core.config import get_settings
from app.core.logging import logger

_mock_vector_store: List[dict[str, Any]] = []


class PineconeClient:
    def __init__(self):
        self.settings = get_settings()

    async def upsert_vector(
        self,
        vector_id: str,
        embedding: List[float],
        metadata: dict[str, Any],
    ) -> None:
        """
        Stores an embedding with metadata (family_id, parent_id, document_id, etc.)
        """
        logger.info(f"Upserting vector {vector_id} for parent {metadata.get('parent_id')}")
        # In mock/local environment:
        _mock_vector_store.append({
            "id": vector_id,
            "values": embedding,
            "metadata": metadata,
        })

    async def query_vectors(
        self,
        query_embedding: List[float],
        metadata_filter: dict[str, Any],
        top_k: int = 5,
    ) -> List[dict[str, Any]]:
        """
        Queries Pinecone with authorization filters.
        """
        parent_id = metadata_filter.get("parent_id")
        matches = []
        for item in _mock_vector_store:
            item_meta = item.get("metadata", {})
            if parent_id and item_meta.get("parent_id") == str(parent_id):
                matches.append(item)
            if len(matches) >= top_k:
                break
        return matches


pinecone_client = PineconeClient()
