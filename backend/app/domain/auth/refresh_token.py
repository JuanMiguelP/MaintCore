"""Modelo RefreshToken — persistencia de refresh tokens."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship


class RefreshToken(Base):
    """Refresh token persistente con soporte para revocaci\u00f3n."""

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(512), nullable=False)  # SHA-256 hash del token
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", backref="refresh_tokens")
