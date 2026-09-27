# backend/app/crud/sharing.py
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories import BaseRepository
from app.models.share import Share


class ShareRepository(BaseRepository[Share]):
    def __init__(self, session: AsyncSession):
        super().__init__(Share, session)

    async def get_by_token(self, token: str) -> Optional[Share]:
        stmt = select(Share).where(Share.token == token)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
