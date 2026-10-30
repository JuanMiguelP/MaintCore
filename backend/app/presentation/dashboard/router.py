"""Router de Dashboard — Resumen ejecutivo del CMMS."""

from datetime import date, timedelta
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import APIRouter, Depends, Query
from app.database import get_db
from app.dependencies import get_current_user
from app.domain.assets.asset import Asset
from app.domain.work_orders.work_order import WorkOrder
from app.domain.preventive_maintenance.maintenance_plan import MaintenancePlan
from app.domain.inventory.part import Part

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    """Resumen ejecutivo de todos los KPIs del CMMS."""
    # 1. Total Assets
    total_assets_result = await db.execute(select(func.count()).select_from(Asset))
    total_assets = total_assets_result.scalar() or 0

    # 2. Active Assets
    active_assets_result = await db.execute(
        select(func.count()).select_from(Asset).where(Asset.status == "ACTIVE")
    )
    active_assets = active_assets_result.scalar() or 0

    # 3. Open Work Orders (OPEN, ASSIGNED, IN_PROGRESS, ON_HOLD)
    open_statuses = ["OPEN", "ASSIGNED", "IN_PROGRESS", "ON_HOLD"]
    open_wo_result = await db.execute(
        select(func.count()).select_from(WorkOrder).where(WorkOrder.status.in_(open_statuses))
    )
    open_work_orders = open_wo_result.scalar() or 0

    # 4. Completed Work Orders (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    completed_wo_result = await db.execute(
        select(func.count()).select_from(WorkOrder).where(
            (WorkOrder.status == "COMPLETED") &
            (WorkOrder.completed_date >= thirty_days_ago)
        )
    )
    completed_last_30_days = completed_wo_result.scalar() or 0

    # 5. Preventive Plans (total)
    plans_result = await db.execute(select(func.count()).select_from(MaintenancePlan))
    preventive_plans = plans_result.scalar() or 0

    # 6. Overdue Preventive Plans
    overdue_plans_result = await db.execute(
        select(func.count()).select_from(MaintenancePlan).where(
            (MaintenancePlan.is_active == True) &
            (MaintenancePlan.next_due_date <= date.today())
        )
    )
    overdue_plans = overdue_plans_result.scalar() or 0

    # 7. Low Stock Parts
    low_stock_result = await db.execute(
        select(func.count()).select_from(Part).where(
            Part.current_stock <= Part.minimum_stock
        )
    )
    low_stock_parts = low_stock_result.scalar() or 0

    # 8. Inventory Valuation
    valuation_result = await db.execute(
        select(func.coalesce(func.sum(Part.current_stock * Part.unit_cost), 0)).select_from(Part)
    )
    inventory_valuation = float(valuation_result.scalar() or 0)

    return {
        "total_assets": total_assets,
        "active_assets": active_assets,
        "open_work_orders": open_work_orders,
        "completed_last_30_days": completed_last_30_days,
        "preventive_plans": preventive_plans,
        "overdue_plans": overdue_plans,
        "low_stock_parts": low_stock_parts,
        "inventory_valuation": inventory_valuation,
    }


@router.get("/work-orders-by-status")
async def get_work_orders_by_status(
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    """Work Orders agrupadas por estado para gráfico de barras."""
    result = await db.execute(
        select(WorkOrder.status, func.count().label("count"))
        .group_by(WorkOrder.status)
    )
    rows = result.all()

    return [
        {"status": row.status, "count": row.count}
        for row in rows
    ]


@router.get("/work-orders-by-priority")
async def get_work_orders_by_priority(
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    """Work Orders agrupadas por prioridad para gráfico de dona."""
    result = await db.execute(
        select(WorkOrder.priority, func.count().label("count"))
        .group_by(WorkOrder.priority)
    )
    rows = result.all()

    return [
        {"priority": row.priority, "count": row.count}
        for row in rows
    ]


@router.get("/maintenance-compliance")
async def get_maintenance_compliance(
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    """Cumplimiento de mantenimiento preventivo para gráfico de línea."""
    # Últimos 7 días
    today = date.today()
    days = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        days.append(day.isoformat())

    compliance_data = []
    for day_str in days:
        day_date = date.fromisoformat(day_str)
        next_day = day_date + timedelta(days=1)

        # Executions generadas ese día
        generated_result = await db.execute(
            select(func.count()).select_from(MaintenancePlan).where(
                (MaintenancePlan.is_active == True) &
                (MaintenancePlan.next_due_date >= day_date) &
                (MaintenancePlan.next_due_date < next_day)
            )
        )
        generated = generated_result.scalar() or 0

        compliance_data.append({
            "date": day_str,
            "generated": generated,
        })

    return compliance_data
