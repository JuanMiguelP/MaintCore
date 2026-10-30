"""Repository de RefreshTokens."""

import hashlib
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.auth.refresh_token import RefreshToken


class RefreshTokenRepository:
    """Operaciones CRUD de refresh tokens."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    async def create(self, user_id: uuid.UUID, token: str, expires_at: datetime) -> RefreshToken:
        rt = RefreshToken(
            user_id=user_id,
            token_hash=self._hash_token(token),
            expires_at=expires_at,
        )
        self.db.add(rt)
        await self.db.commit()
        await self.db.refresh(rt)
        return rt

    async def get_by_token(self, token: str) -> RefreshToken | None:
        h = self._hash_token(token)
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == h,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.utcnow(),
            )
        )
        return result.scalar_one_or_none()

    async def revoke(self, token: str) -> bool:
        h = self._hash_token(token)
        from sqlalchemy import update
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.token_hash == h, RefreshToken.revoked == False)
            .values(revoked=True)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def revoke_all_user_tokens(self, user_id: uuid.UUID) -> int:
        from sqlalchemy import update
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
            .values(revoked=True)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount

    async def cleanup_expired(self) -> int:
        from sqlalchemy import delete
        stmt = delete(RefreshToken).where(
            RefreshToken.expires_at < datetime.utcnow(),
            RefreshToken.revoked == False,
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount
