"""Modelo WorkOrder — Dominio de Ordenes de Trabajo."""

import uuid
from datetime import date, datetime

from sqlalchemy import String, Float, DateTime, Date, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WorkOrder(Base):
    """Orden de trabajo para mantenimiento."""

    __tablename__ = "work_orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    wo_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("assets.id"), nullable=True, index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="OPEN", index=True)  # OPEN, ASSIGNED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    requested_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_hours: Mapped[float] = mapped_column(Float, default=0.0)
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relaciones
    parts = relationship("WorkOrderPart", back_populates="work_order", cascade="all, delete-orphan", lazy="selectin")
