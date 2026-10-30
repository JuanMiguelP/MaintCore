"""Modelo PartAlertState — Estado de alertas por repuesto."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PartAlertState(Base):
    """Estado de alertas para cada repuesto (anti-spam)."""

    __tablename__ = "part_alert_states"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    part_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("parts.id"), nullable=False, unique=True, index=True)
    is_low_stock: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_out_of_stock: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_notification_sent: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
