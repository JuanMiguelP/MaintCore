"""Modelo MaintenancePlan — Dominio de Mantenimiento Preventivo."""

import uuid
from datetime import date, datetime

from sqlalchemy import String, Float, DateTime, Date, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MaintenancePlan(Base):
    """Plan de mantenimiento preventivo asociado a un activo."""

    __tablename__ = "maintenance_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    asset_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assets.id"), nullable=False, index=True)
    frequency_type: Mapped[str] = mapped_column(String(20), nullable=False)  # DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
    frequency_value: Mapped[int] = mapped_column(nullable=False, default=1)  # Cada N frecuencia (ej: cada 2 meses)
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
    last_generated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_due_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
