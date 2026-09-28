# backend/app/clients/gemini.py
import json
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import logger


class GeminiClient:
    def __init__(self):
        self.settings = get_settings()

    async def generate_content(self, prompt: str) -> str:
        """
        Calls the configured Gemini model. Clinical answers are never fabricated.
        """
        api_key = self.settings.gemini_api_key.get_secret_value()
        if api_key and not api_key.startswith("mock"):
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model_name = self.settings.gemini_model or "gemini-3.8-flash"
                model = genai.GenerativeModel(model_name)
                response = await model.generate_content_async(prompt)
                return response.text
            except Exception as exc:
                logger.error(f"Gemini generation failed: {exc}")
                raise ProviderError("Gemini", "The assistant is temporarily unavailable.") from exc
        raise ProviderError("Gemini", "AI generation is not configured.")

    async def create_embedding(self, text: str) -> list[float]:
        """
        Creates semantic vector embedding using live embedding model.
        """
        api_key = self.settings.gemini_api_key.get_secret_value()
        if api_key and not api_key.startswith("mock"):
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                embed_model = self.settings.embedding_model or "gemini-embedding-2"
                if not embed_model.startswith("models/"):
                    embed_model = f"models/{embed_model}"
                result = genai.embed_content(
                    model=embed_model,
                    content=text,
                    task_type="retrieval_document",
                )
                return result["embedding"]
            except Exception as exc:
                logger.error(f"Gemini embedding failed: {exc}")
                raise ProviderError("Gemini", "Document search indexing is temporarily unavailable.") from exc
        raise ProviderError("Gemini", "Document embeddings are not configured.")

    async def extract_medical_document(self, content: bytes, mime_type: str, title: str) -> dict[str, Any]:
        api_key = self.settings.gemini_api_key.get_secret_value()
        if not api_key or api_key.startswith("mock"):
            raise RuntimeError("Gemini document extraction is not configured")

        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(self.settings.gemini_model)
        prompt = f"""
Analyze the attached medical document titled {title!r}. Return JSON only with this schema:
{{
  "summary": "concise factual clinical summary without advice",
  "raw_text": "faithful transcription of visible medical text",
  "extracted_fields": {{"field": "value with units and reference range when present"}},
  "tags": ["document category", "clinical topic"],
  "suggested_timeline_events": [
    {{"title": "event", "description": "factual description", "event_type": "lab_test"}}
  ]
}}
Never invent unreadable values. Use null or omit a field when uncertain. Do not diagnose.
"""
        response = await model.generate_content_async([
            prompt,
            {"mime_type": mime_type, "data": content},
        ])
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(raw)


gemini_client = GeminiClient()
