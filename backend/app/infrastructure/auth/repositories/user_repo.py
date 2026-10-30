"""Repository de usuarios — capa de infraestructura."""

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.auth.user import User
from app.shared.exceptions import NotFoundError


class UserRepository:
    """Operaciones CRUD de usuarios en base de datos."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).options(selectinload(User.role)).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).options(selectinload(User.role)).where(User.username == username))
        return result.scalar_one_or_none()

    async def list(self, skip: int = 0, limit: int = 50, search: str | None = None) -> tuple[list[User], int]:
        query = select(User).options(selectinload(User.role))
        total_query = select(User).where(User.is_active == True)

        if search:
            like_pattern = f"%{search}%"
            query = query.where(
                (User.username.ilike(like_pattern)) | (User.email.ilike(like_pattern))
            )
            total_query = total_query.where(
                (User.username.ilike(like_pattern)) | (User.email.ilike(like_pattern))
            )

        total_result = await self.db.execute(total_query)
        total = len(total_result.scalars().all())

        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await self.db.execute(query)
        users = result.scalars().all()
        return users, total

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update(self, user_id: uuid.UUID, **kwargs) -> User:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(**{k: v for k, v in kwargs.items() if v is not None})
        )
        await self.db.execute(stmt)
        await self.db.commit()

        updated = await self.get_by_id(user_id)
        if not updated:
            raise NotFoundError("User", user_id)
        return updated

    async def delete(self, user_id: uuid.UUID) -> None:
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        await self.db.delete(user)
        await self.db.commit()
