"""Modelo StockMovement — Dominio de Movimientos de Inventario."""

import uuid
from datetime import datetime

from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column


class StockMovement(Base):
    """Registro de movimiento de stock (entrada, salida, ajuste)."""

    __tablename__ = "stock_movements"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    part_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("parts.id"), nullable=False, index=True)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)  # IN, OUT, ADJUSTMENT
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    performed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    performed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
