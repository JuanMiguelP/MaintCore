"""Use Cases del dominio de Preventive Maintenance."""

import uuid
from datetime import date, datetime, timedelta
from sqlalchemy import func, select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.preventive_maintenance.maintenance_plan import MaintenancePlan
from app.domain.preventive_maintenance.maintenance_plan_execution import MaintenancePlanExecution
from app.domain.work_orders.work_order import WorkOrder
from app.domain.assets.asset import Asset
from app.domain.auth.user import User
from app.shared.exceptions import NotFoundError, ConflictError

FREQUENCY_MAP = {
    "DAILY": {"delta": timedelta(days=1)},
    "WEEKLY": {"delta": timedelta(weeks=1)},
    "MONTHLY": {"delta": timedelta(days=30)},
    "QUARTERLY": {"delta": timedelta(days=90)},
    "YEARLY": {"delta": timedelta(days=365)},
}



def _calculate_next_due_date(last_date: date | None, frequency_type: str, frequency_value: int) -> date:
    """Calcula la próxima fecha de vencimiento."""
    if last_date is None:
        return date.today()
    freq = FREQUENCY_MAP.get(frequency_type, {"delta": timedelta(days=30)})
    delta = freq["delta"] * frequency_value
    return last_date + delta


def _plan_to_dict(plan: MaintenancePlan, an: str | None = None, cn: str | None = None) -> dict:
    """Convierte un MaintenancePlan a dict para respuesta."""
    return {
        "id": str(plan.id),
        "code": plan.code,
        "name": plan.name,
        "description": plan.description,
        "asset_name": an,
        "frequency_type": plan.frequency_type,
        "frequency_value": plan.frequency_value,
        "estimated_hours": plan.estimated_hours,
        "priority": plan.priority,
        "is_active": plan.is_active,
        "last_generated_at": plan.last_generated_at.isoformat() if plan.last_generated_at else None,
        "next_due_date": plan.next_due_date.isoformat() if plan.next_due_date else None,
        "created_by": str(plan.created_by) if plan.created_by else None,
        "created_at": plan.created_at.isoformat(),
        "updated_at": plan.updated_at.isoformat(),
    }


# ─── HELPER: CREATE WORK ORDER FROM PLAN ──────────────────
# NOTA: NO hace commit aquí. El caller maneja la transacción completa.

async def _create_wo_from_plan(
    db: AsyncSession,
    plan: MaintenancePlan,
    scheduled_date: date,
) -> uuid.UUID | None:
    """Crea una WorkOrder desde un MaintenancePlan y retorna el work_order_id.
    
    Regresa None si ya existe ejecución vinculada para esta fecha.
    NO hace commit — el caller maneja la transacción completa.
    """
    # Verificar si ya existe ejecución con work_order_id para esta fecha
    existing_exec = await db.execute(
        select(MaintenancePlanExecution).where(
            (MaintenancePlanExecution.plan_id == plan.id) &
            (MaintenancePlanExecution.scheduled_date == scheduled_date) &
            (MaintenancePlanExecution.work_order_id.isnot(None))
        )
    )
    if existing_exec.scalar_one_or_none():
        return None  # Ya existe WO para esta ejecución

    wo = WorkOrder(
        title=plan.name,
        description=plan.description,
        asset_id=plan.asset_id,
        priority=plan.priority,
        status="OPEN",
        scheduled_date=scheduled_date,
        estimated_hours=plan.estimated_hours,
        requested_by=plan.created_by,
    )
    db.add(wo)
    await db.refresh(wo)
    return wo.id


# ─── CREATE ───────────────────────────────────────────────

async def create_maintenance_plan(
    db: AsyncSession,
    name: str,
    asset_id: uuid.UUID,
    frequency_type: str,
    frequency_value: int = 1,
    description: str | None = None,
    estimated_hours: float | None = None,
    priority: str = "MEDIUM",
    created_by: uuid.UUID | None = None,
) -> dict:
    """Crea un nuevo plan de mantenimiento preventivo."""
    r = await db.execute(select(Asset).where(Asset.id == asset_id))
    if not r.scalar_one_or_none():
        raise NotFoundError("Asset", asset_id)

    base = f"MP-{datetime.utcnow().strftime('%Y%m%d')}-"
    n = 1
    while True:
        code = f"{base}{n:04d}"
        ex = await db.execute(select(MaintenancePlan).where(MaintenancePlan.code == code))
        if not ex.scalar_one_or_none():
            break
        n += 1

    next_due = date.today()

    plan = MaintenancePlan(
        code=code, name=name, description=description,
        asset_id=asset_id, frequency_type=frequency_type,
        frequency_value=frequency_value, estimated_hours=estimated_hours,
        priority=priority, is_active=True, next_due_date=next_due,
        created_by=created_by,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)

    an = None
    if asset_id:
        r2 = await db.execute(select(Asset.name).where(Asset.id == asset_id))
        an = r2.scalar_one_or_none()
    return _plan_to_dict(plan, an)


# ─── READ (GET) ───────────────────────────────────────────

async def get_maintenance_plan(db: AsyncSession, plan_id: uuid.UUID) -> dict:
    """Obtiene un plan de mantenimiento por ID."""
    r = await db.execute(select(MaintenancePlan).where(MaintenancePlan.id == plan_id))
    plan = r.scalar_one_or_none()
    if not plan:
        raise NotFoundError("MaintenancePlan", plan_id)
    an = None
    if plan.asset_id:
        r2 = await db.execute(select(Asset.name).where(Asset.id == plan.asset_id))
        an = r2.scalar_one_or_none()
    return _plan_to_dict(plan, an)


# ─── LIST ─────────────────────────────────────────────────

async def list_maintenance_plans(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    asset_id: uuid.UUID | None = None,
    is_active: bool | None = None,
    frequency_type: str | None = None,
) -> dict:
    """Lista de planes de mantenimiento paginada."""
    base_query = select(MaintenancePlan)
    if search:
        sp = f"%{search}%"
        base_query = base_query.where(
            MaintenancePlan.name.ilike(sp) | MaintenancePlan.code.ilike(sp)
        )
    if asset_id:
        base_query = base_query.where(MaintenancePlan.asset_id == asset_id)
    if is_active is not None:
        base_query = base_query.where(MaintenancePlan.is_active == is_active)
    if frequency_type:
        base_query = base_query.where(MaintenancePlan.frequency_type == frequency_type)

    count_q = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar()

    items_q = (
        base_query
        .order_by(MaintenancePlan.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items_result = await db.execute(items_q)
    plans = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    items = []
    for p in plans:
        an = None
        if p.asset_id:
            r = await db.execute(select(Asset.name).where(Asset.id == p.asset_id))
            an = r.scalar_one_or_none()
        items.append(_plan_to_dict(p, an))

    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


# ─── UPDATE ───────────────────────────────────────────────

async def update_maintenance_plan(
    db: AsyncSession,
    plan_id: uuid.UUID,
    name: str | None = None,
    description: str | None = None,
    asset_id: uuid.UUID | None = None,
    frequency_type: str | None = None,
    frequency_value: int | None = None,
    estimated_hours: float | None = None,
    priority: str | None = None,
    is_active: bool | None = None,
) -> dict:
    """Actualiza un plan de mantenimiento."""
    r = await db.execute(select(MaintenancePlan).where(MaintenancePlan.id == plan_id))
    plan = r.scalar_one_or_none()
    if not plan:
        raise NotFoundError("MaintenancePlan", plan_id)
    if asset_id:
        r2 = await db.execute(select(Asset).where(Asset.id == asset_id))
        if not r2.scalar_one_or_none():
            raise NotFoundError("Asset", asset_id)

    if name is not None:
        plan.name = name
    if description is not None:
        plan.description = description
    if asset_id is not None:
        plan.asset_id = asset_id
    if frequency_type is not None:
        plan.frequency_type = frequency_type
    if frequency_value is not None:
        plan.frequency_value = frequency_value
    if estimated_hours is not None:
        plan.estimated_hours = estimated_hours
    if priority is not None:
        plan.priority = priority
    if is_active is not None:
        plan.is_active = is_active

    await db.commit()
    await db.refresh(plan)

    an = None
    if plan.asset_id:
        r3 = await db.execute(select(Asset.name).where(Asset.id == plan.asset_id))
        an = r3.scalar_one_or_none()
    return _plan_to_dict(plan, an)


# ─── DELETE ───────────────────────────────────────────────

async def delete_maintenance_plan(db: AsyncSession, plan_id: uuid.UUID) -> dict:
    """Elimina un plan de mantenimiento."""
    r = await db.execute(select(MaintenancePlan).where(MaintenancePlan.id == plan_id))
    plan = r.scalar_one_or_none()
    if not plan:
        raise NotFoundError("MaintenancePlan", plan_id)
    await db.execute(delete(MaintenancePlanExecution).where(MaintenancePlanExecution.plan_id == plan_id))
    await db.delete(plan)
    await db.commit()
    return {"message": f"MaintenancePlan {plan.code} deleted"}


# ─── GENERATE FROM PLAN (Manual) ──────────────────────────

async def generate_from_plan(
    db: AsyncSession,
    plan_id: uuid.UUID,
    scheduled_date: date,
    generated_by: uuid.UUID | None = None,
) -> dict:
    """Genera manualmente una ejecución desde un plan con atomicidad total.
    
    Transacción única: Execution + WorkOrder + Relación + Commit.
    Si cualquier paso falla → rollback completo.
    """
    # 1. Validar plan
    r = await db.execute(select(MaintenancePlan).where(MaintenancePlan.id == plan_id))
    plan = r.scalar_one_or_none()
    if not plan:
        raise NotFoundError("MaintenancePlan", plan_id)
    if not plan.is_active:
        raise ConflictError("Cannot generate from inactive plan")

    # 2. Verificar duplicado: no puede existir Execution para plan_id + scheduled_date
    existing = await db.execute(
        select(MaintenancePlanExecution).where(
            (MaintenancePlanExecution.plan_id == plan_id) &
            (MaintenancePlanExecution.scheduled_date == scheduled_date)
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(f"Execution already exists for date {scheduled_date}")

    # 3. Verificar si ya existe WO vinculada a esta ejecución
    existing_wo = await db.execute(
        select(MaintenancePlanExecution).where(
            (MaintenancePlanExecution.plan_id == plan_id) &
            (MaintenancePlanExecution.scheduled_date == scheduled_date) &
            (MaintenancePlanExecution.work_order_id.isnot(None))
        )
    )
    if existing_wo.scalar_one_or_none():
        raise ConflictError(f"WorkOrder already linked to this execution")

    # ─── TRANSACCIÓN ÚNICA ──────────────────────────────────
    try:
        # Paso A: Crear Execution
        execution = MaintenancePlanExecution(
            plan_id=plan_id,
            scheduled_date=scheduled_date,
            generated_by="USER",
            status="PENDING",
        )
        db.add(execution)

        # Paso B: Crear WorkOrder desde el Plan
        wo_id = await _create_wo_from_plan(db, plan, scheduled_date)
        if wo_id is None:
            # Ya existe WO vinculada (check adicional por seguridad)
            raise ConflictError("WorkOrder already exists for this execution")

        # Paso C: Vincular Execution con WorkOrder
        execution.work_order_id = wo_id

        # Commit único: todo o nada
        await db.commit()
        await db.refresh(execution)

    except Exception:
        await db.rollback()
        raise

    return {
        "id": str(execution.id),
        "plan_id": str(plan_id),
        "work_order_id": str(execution.work_order_id),
        "scheduled_date": execution.scheduled_date.isoformat(),
        "generated_by": execution.generated_by,
        "status": execution.status,
        "created_at": execution.created_at.isoformat(),
    }


# ─── AUTO GENERATE OVERDUE ────────────────────────────────

async def auto_generate_overdue(
    db: AsyncSession,
    generated_by: uuid.UUID | None = None,
) -> dict:
    """Genera automáticamente ejecuciones para planes vencidos con atomicidad total.
    
    Transacción única: todas las Execution + WorkOrder o nada.
    Si cualquier paso falla → rollback completo.
    """
    today = date.today()

    # 1. Buscar planes activos vencidos
    base_query = (
        select(MaintenancePlan)
        .where(
            (MaintenancePlan.is_active == True) &
            (MaintenancePlan.next_due_date <= today)
        )
    )
    result = await db.execute(base_query)
    plans = result.scalars().all()

    if not plans:
        return {
            "generated_count": 0,
            "plans": [],
        }

    # 2. Verificar duplicados antes de crear nada
    for plan in plans:
        existing = await db.execute(
            select(MaintenancePlanExecution).where(
                (MaintenancePlanExecution.plan_id == plan.id) &
                (MaintenancePlanExecution.scheduled_date == plan.next_due_date)
            )
        )
        if existing.scalar_one_or_none():
            # Ya existe ejecución para este plan y fecha → saltar
            continue

    # ─── TRANSACCIÓN ÚNICA ──────────────────────────────────
    generated = []
    try:
        for plan in plans:
            # Verificar duplicado nuevamente dentro de la transacción
            check = await db.execute(
                select(MaintenancePlanExecution).where(
                    (MaintenancePlanExecution.plan_id == plan.id) &
                    (MaintenancePlanExecution.scheduled_date == plan.next_due_date)
                )
            )
            if check.scalar_one_or_none():
                continue

            # Crear Execution
            execution = MaintenancePlanExecution(
                plan_id=plan.id,
                scheduled_date=plan.next_due_date,
                generated_by="SYSTEM",
                status="PENDING",
            )
            db.add(execution)

            # Crear WorkOrder desde el Plan
            wo_id = await _create_wo_from_plan(db, plan, plan.next_due_date)
            if wo_id:
                execution.work_order_id = wo_id

            # Actualizar plan
            plan.last_generated_at = datetime.utcnow()
            plan.next_due_date = _calculate_next_due_date(
                plan.next_due_date, plan.frequency_type, plan.frequency_value
            )

            generated.append({
                "plan_id": str(plan.id),
                "plan_code": plan.code,
                "scheduled_date": plan.next_due_date.isoformat(),
                "work_order_id": str(execution.work_order_id) if execution.work_order_id else None,
            })

        # Commit único: todo o nada
        await db.commit()

    except Exception:
        await db.rollback()
        raise

    return {
        "generated_count": len(generated),
        "plans": generated,
    }


# ─── GET OVERDUE PLANS ────────────────────────────────────

async def get_overdue_plans(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Obtiene planes de mantenimiento vencidos."""
    today = date.today()

    base_query = (
        select(MaintenancePlan)
        .where(
            (MaintenancePlan.is_active == True) &
            (MaintenancePlan.next_due_date <= today)
        )
        .order_by(MaintenancePlan.next_due_date.asc())
    )

    count_q = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar()

    items_q = base_query.offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_q)
    plans = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    items = []
    for p in plans:
        an = None
        if p.asset_id:
            r = await db.execute(select(Asset.name).where(Asset.id == p.asset_id))
            an = r.scalar_one_or_none()
        items.append(_plan_to_dict(p, an))

    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


# ─── GET UPCOMING PLANS ───────────────────────────────────

async def get_upcoming_plans(
    db: AsyncSession,
    days_ahead: int = 30,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Obtiene planes de mantenimiento próximos a vencer."""
    today = date.today()
    future = today + timedelta(days=days_ahead)

    base_query = (
        select(MaintenancePlan)
        .where(
            (MaintenancePlan.is_active == True) &
            (MaintenancePlan.next_due_date > today) &
            (MaintenancePlan.next_due_date <= future)
        )
        .order_by(MaintenancePlan.next_due_date.asc())
    )

    count_q = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar()

    items_q = base_query.offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_q)
    plans = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    items = []
    for p in plans:
        an = None
        if p.asset_id:
            r = await db.execute(select(Asset.name).where(Asset.id == p.asset_id))
            an = r.scalar_one_or_none()
        items.append(_plan_to_dict(p, an))

    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


# ─── UPDATE EXECUTION STATUS FROM WO ──────────────────────

async def update_execution_status_from_wo(
    db: AsyncSession,
    wo_id: uuid.UUID,
    new_status: str,
) -> dict | None:
    """Actualiza MaintenanceExecution.status cuando WorkOrder cambia a COMPLETED/CANCELLED."""
    if new_status not in ("COMPLETED", "CANCELLED"):
        return None

    r = await db.execute(
        select(MaintenancePlanExecution).where(
            MaintenancePlanExecution.work_order_id == wo_id
        )
    )
    execution = r.scalar_one_or_none()
    if not execution:
        return None

    execution.status = new_status
    await db.commit()
    await db.refresh(execution)

    return {
        "id": str(execution.id),
        "plan_id": str(execution.plan_id),
        "work_order_id": str(execution.work_order_id),
        "status": execution.status,
        "scheduled_date": execution.scheduled_date.isoformat(),
    }

