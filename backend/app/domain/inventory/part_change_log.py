"""Modelo PartChangeLog — Historial de cambios de campo en Parts."""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PartChangeLog(Base):
    """Registro de cada campo modificado en un producto (Part)."""

    __tablename__ = "part_change_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    part_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("parts.id"), nullable=False, index=True)
    field_name: Mapped[str] = mapped_column(String(50), nullable=False)  # nombre del campo cambiado
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)  # valor anterior (serializado)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)  # valor nuevo (serializado)
    performed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    part = relationship("Part", back_populates="change_logs")
    user = relationship("User", back_populates="part_change_logs")
