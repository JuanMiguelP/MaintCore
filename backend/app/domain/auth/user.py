"""Modelo User — Dominio de Autenticaci\u00f3n."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.domain.inventory.part_change_log import PartChangeLog  # noqa: F401


class User(Base):
    """Usuario del sistema con autenticaci\u00f3n y roles."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("roles.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relaciones
    role = relationship("Role", back_populates="users", lazy="joined")
    audit_logs = relationship("AuditLog", back_populates="user", lazy="selectin")
    part_change_logs = relationship("PartChangeLog", back_populates="user", lazy="selectin")

    @property
    def role_name(self) -> str | None:
        return self.role.name if self.role else None

