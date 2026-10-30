"""Modelo WorkOrderPart — Consumos de repuestos en OT."""

import uuid
from datetime import datetime

from sqlalchemy import String, Float, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WorkOrderPart(Base):
    """Repuesto consumido en una orden de trabajo."""

    __tablename__ = "work_order_parts"
    __table_args__ = (
        UniqueConstraint("work_order_id", "part_id", name="uq_work_order_part"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    work_order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("work_orders.id"), nullable=False, index=True)
    part_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("parts.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_cost: Mapped[float] = mapped_column(nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relaciones
    work_order = relationship("WorkOrder", back_populates="parts", lazy="joined")
    part = relationship("Part", lazy="joined")
