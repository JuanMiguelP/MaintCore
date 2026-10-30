"""Modelo NotificationRule — Reglas de notificación."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Text, Boolean, func, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class NotificationRule(Base):
    """Regla que define qué eventos generan notificaciones."""

    __tablename__ = "notification_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # LOW_STOCK, OUT_OF_STOCK, etc.
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    recipients: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)  # Lista de emails
    frequency: Mapped[str] = mapped_column(String(20), nullable=False, default="ON_CHANGE")  # ON_CHANGE, DAILY_SUMMARY
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
