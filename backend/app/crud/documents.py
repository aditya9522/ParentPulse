# backend/app/crud/documents.py
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories import BaseRepository
from app.models.document import Document


class DocumentRepository(BaseRepository[Document]):
    def __init__(self, session: AsyncSession):
        super().__init__(Document, session)

    async def list_by_parent(
        self,
        parent_id: UUID,
        document_type: Optional[str] = None,
        include_archived: bool = False,
    ) -> List[Document]:
        conditions = [Document.parent_id == parent_id]
        if not include_archived:
            conditions.append(Document.is_archived.is_(False))
        if document_type:
            conditions.append(Document.document_type == document_type)

        stmt = select(Document).where(and_(*conditions)).order_by(Document.document_date.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def search_documents(self, parent_id: UUID, search_term: str) -> List[Document]:
        pattern = f"%{search_term.lower()}%"
        stmt = (
            select(Document)
            .where(
                and_(
                    Document.parent_id == parent_id,
                    Document.is_archived.is_(False),
                    (
                        Document.title.ilike(pattern)
                        | Document.doctor_name.ilike(pattern)
                        | Document.hospital_name.ilike(pattern)
                        | Document.summary.ilike(pattern)
                    ),
                )
            )
            .order_by(Document.document_date.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
