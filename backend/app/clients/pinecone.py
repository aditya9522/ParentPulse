import asyncio
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import logger


class PineconeClient:
    def __init__(self):
        self.settings = get_settings()
        self._index: Any | None = None

    def _get_index(self):
        api_key = self.settings.pinecone_api_key.get_secret_value()
        if not api_key or api_key.startswith("mock"):
            raise ProviderError("Pinecone", "Semantic document search is not configured.")
        if self._index is None:
            from pinecone import Pinecone

            self._index = Pinecone(api_key=api_key).Index(self.settings.pinecone_index_name)
        return self._index

    async def upsert_vector(self, vector_id: str, embedding: list[float], metadata: dict[str, Any]) -> None:
        try:
            index = self._get_index()
            await asyncio.to_thread(
                index.upsert,
                vectors=[{"id": vector_id, "values": embedding, "metadata": metadata}],
                namespace=self.settings.pinecone_namespace,
            )
        except ProviderError:
            raise
        except Exception as exc:
            logger.error(f"Pinecone upsert failed: {exc}")
            raise ProviderError("Pinecone", "Document indexing is temporarily unavailable.") from exc

    async def query_vectors(self, query_embedding: list[float], metadata_filter: dict[str, Any], top_k: int = 5) -> list[dict[str, Any]]:
        try:
            index = self._get_index()
            result = await asyncio.to_thread(
                index.query,
                vector=query_embedding,
                filter=metadata_filter,
                top_k=top_k,
                include_metadata=True,
                namespace=self.settings.pinecone_namespace,
            )
            matches = result.get("matches", []) if isinstance(result, dict) else getattr(result, "matches", [])
            return [match if isinstance(match, dict) else match.to_dict() for match in matches]
        except ProviderError:
            raise
        except Exception as exc:
            logger.error(f"Pinecone query failed: {exc}")
            raise ProviderError("Pinecone", "Semantic document search is temporarily unavailable.") from exc


pinecone_client = PineconeClient()
