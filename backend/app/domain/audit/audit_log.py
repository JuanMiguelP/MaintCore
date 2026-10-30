"""Modelo AuditLog — Dominio de Auditor\u00eda."""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship


class AuditLog(Base):
    """Registro inmutable de acciones del sistema."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    entity: Mapped[str] = mapped_column(String(50), nullable=False)  # User, Asset, WorkOrder, etc.
    entity_id: Mapped[uuid.UUID | None] = mapped_column(uuid.UUID, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="audit_logs")
