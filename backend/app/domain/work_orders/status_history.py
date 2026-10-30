"""Modelo WorkOrderStatusHistory — Histórico de cambios de estado."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WorkOrderStatusHistory(Base):
    """Registro histórico de cambios de estado de una orden de trabajo."""

    __tablename__ = "work_order_status_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    work_order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("work_orders.id"), nullable=False, index=True)
    old_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    new_status: Mapped[str] = mapped_column(String(20), nullable=False)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
