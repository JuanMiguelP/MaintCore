"""Modelo MaintenancePlanExecution — Histórico de ejecuciones de planes."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MaintenancePlanExecution(Base):
    """Registro de cada ejecución generada por un plan preventivo."""

    __tablename__ = "maintenance_plan_executions"
    __table_args__ = (
        # Una sola Execution por plan_id + scheduled_date
        UniqueConstraint("plan_id", "scheduled_date", name="uq_pm_execution_plan_date"),
        # Una sola Execution vinculada a cada WorkOrder
        UniqueConstraint("work_order_id", name="uq_pm_execution_work_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("maintenance_plans.id"), nullable=False, index=True)
    work_order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    scheduled_date: Mapped[date] = mapped_column(nullable=False, index=True)
    generated_by: Mapped[str] = mapped_column(String(50), nullable=False, default="SYSTEM")  # SYSTEM o usuario
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")  # PENDING, COMPLETED, CANCELLED
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
