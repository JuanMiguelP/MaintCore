"""Modelo Part — Dominio de Spare Parts."""

import uuid
from datetime import datetime

from sqlalchemy import String, Float, Integer, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.inventory.part_change_log import PartChangeLog  # noqa: F401


class Part(Base):
    """Repuesto o pieza de inventario."""

    __tablename__ = "parts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    part_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    manufacturer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("suppliers.id"), nullable=True, index=True)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0)
    minimum_stock: Mapped[int] = mapped_column(Integer, default=0)
    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    change_logs = relationship("PartChangeLog", back_populates="part", lazy="selectin")
