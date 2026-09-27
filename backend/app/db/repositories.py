# backend/app/db/repositories.py
from typing import Any, Generic, Optional, Type, TypeVar
from uuid import UUID
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == id)  # type: ignore
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **kwargs: Any) -> ModelType:
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        return instance

    async def update(self, id: UUID, **kwargs: Any) -> Optional[ModelType]:
        stmt = (
            update(self.model)
            .where(self.model.id == id)  # type: ignore
            .values(**kwargs)
            .returning(self.model)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete(self, id: UUID) -> bool:
        stmt = delete(self.model).where(self.model.id == id)  # type: ignore
        result = await self.session.execute(stmt)
        return result.rowcount > 0  # type: ignore
