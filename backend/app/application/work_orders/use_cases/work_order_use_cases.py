"""Use Cases del dominio de WorkOrders."""

import uuid
from datetime import datetime, date
from sqlalchemy import func, select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.work_orders.work_order import WorkOrder
from app.domain.work_orders.status_history import WorkOrderStatusHistory
from app.domain.work_orders.work_order_part import WorkOrderPart
from app.domain.assets.asset import Asset
from app.domain.inventory.part import Part
from app.domain.inventory.stock_movement import StockMovement
from app.domain.auth.user import User
from app.shared.exceptions import NotFoundError, ValidationError, ConflictError

VALID_TRANSITIONS = {
    "OPEN": ["ASSIGNED", "CANCELLED"],
    "ASSIGNED": ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["ON_HOLD", "COMPLETED"],
    "ON_HOLD": ["IN_PROGRESS"],
    "COMPLETED": [],
    "CANCELLED": [],
}


def _wo_to_dict(
    wo: WorkOrder,
    an: str | None = None,
    tn: str | None = None,
    rn: str | None = None,
) -> dict:
    """Convierte un WorkOrder a dict para respuesta."""
    return {
        "id": str(wo.id),
        "wo_number": wo.wo_number,
        "title": wo.title,
        "description": wo.description,
        "asset_name": an,
        "priority": wo.priority,
        "status": wo.status,
        "technician_name": tn,
        "requester_name": rn,
        "estimated_hours": wo.estimated_hours,
        "actual_hours": wo.actual_hours,
        "scheduled_date": wo.scheduled_date.isoformat() if wo.scheduled_date else None,
        "start_date": wo.start_date.isoformat() if wo.start_date else None,
        "completed_date": wo.completed_date.isoformat() if wo.completed_date else None,
        "notes": wo.notes,
        "created_at": wo.created_at.isoformat(),
        "updated_at": wo.updated_at.isoformat(),
    }


# ─── CREATE ───────────────────────────────────────────────

async def create_work_order(
    db: AsyncSession,
    title: str,
    description: str | None = None,
    asset_id: uuid.UUID | None = None,
    priority: str = "MEDIUM",
    assigned_to: uuid.UUID | None = None,
    scheduled_date: date | None = None,
    estimated_hours: float | None = None,
    notes: str | None = None,
    requested_by: uuid.UUID | None = None,
) -> dict:
    """Crea una nueva orden de trabajo."""
    if asset_id:
        r = await db.execute(select(Asset).where(Asset.id == asset_id))
        if not r.scalar_one_or_none():
            raise NotFoundError("Asset", asset_id)
    if assigned_to:
        r = await db.execute(select(User).where(User.id == assigned_to))
        if not r.scalar_one_or_none():
            raise NotFoundError("User", assigned_to)
    if requested_by:
        r = await db.execute(select(User).where(User.id == requested_by))
        if not r.scalar_one_or_none():
            raise NotFoundError("User", requested_by)

    base = f"WO-{datetime.utcnow().strftime('%Y%m%d')}-"
    n = 1
    while True:
        wn = f"{base}{n:04d}"
        ex = await db.execute(select(WorkOrder).where(WorkOrder.wo_number == wn))
        if not ex.scalar_one_or_none():
            break
        n += 1

    wo = WorkOrder(
        wo_number=wn, title=title, description=description,
        asset_id=asset_id, priority=priority, status="OPEN",
        assigned_to=assigned_to, scheduled_date=scheduled_date,
        estimated_hours=estimated_hours, notes=notes, requested_by=requested_by,
    )
    db.add(wo)
    try:
        await db.commit()
        await db.refresh(wo)
    except IntegrityError:
        await db.rollback()
        raise ConflictError(
            "Work order number generation conflict. Please try again."
        ) from None
    except Exception:
        await db.rollback()
        raise

    an = None
    if asset_id:
        r = await db.execute(select(Asset.name).where(Asset.id == asset_id))
        an = r.scalar_one_or_none()
    return _wo_to_dict(wo, an)


# ─── READ (GET) ───────────────────────────────────────────

async def get_work_order(db: AsyncSession, wo_id: uuid.UUID) -> dict:
    """Obtiene una orden de trabajo por ID con relaciones."""
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = r.scalar_one_or_none()
    if not wo:
        raise NotFoundError("WorkOrder", wo_id)
    an = None
    if wo.asset_id:
        r2 = await db.execute(select(Asset.name).where(Asset.id == wo.asset_id))
        an = r2.scalar_one_or_none()
    tn = None
    if wo.assigned_to:
        r3 = await db.execute(select(User.full_name).where(User.id == wo.assigned_to))
        tn = r3.scalar_one_or_none()
    rn = None
    if wo.requested_by:
        r4 = await db.execute(select(User.full_name).where(User.id == wo.requested_by))
        rn = r4.scalar_one_or_none()
    return _wo_to_dict(wo, an, tn, rn)


# ─── LIST ─────────────────────────────────────────────────

async def list_work_orders(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    asset_id: uuid.UUID | None = None,
    assigned_to: uuid.UUID | None = None,
) -> dict:
    """Lista de work orders paginada con filtros."""
    base_query = select(WorkOrder)
    if search:
        sp = f"%{search}%"
        base_query = base_query.where(
            WorkOrder.title.ilike(sp) | WorkOrder.wo_number.ilike(sp)
        )
    if status:
        base_query = base_query.where(WorkOrder.status == status)
    if priority:
        base_query = base_query.where(WorkOrder.priority == priority)
    if asset_id:
        base_query = base_query.where(WorkOrder.asset_id == asset_id)
    if assigned_to:
        base_query = base_query.where(WorkOrder.assigned_to == assigned_to)

    count_q = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar()

    items_q = (
        base_query
        .order_by(WorkOrder.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items_result = await db.execute(items_q)
    work_orders = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    items = []
    for wo in work_orders:
        an = tn = rn = None
        if wo.asset_id:
            r = await db.execute(select(Asset.name).where(Asset.id == wo.asset_id))
            an = r.scalar_one_or_none()
        if wo.assigned_to:
            r = await db.execute(select(User.full_name).where(User.id == wo.assigned_to))
            tn = r.scalar_one_or_none()
        if wo.requested_by:
            r = await db.execute(select(User.full_name).where(User.id == wo.requested_by))
            rn = r.scalar_one_or_none()
        items.append(_wo_to_dict(wo, an, tn, rn))

    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


# ─── UPDATE ───────────────────────────────────────────────

async def update_work_order(
    db: AsyncSession,
    wo_id: uuid.UUID,
    title: str | None = None,
    description: str | None = None,
    asset_id: uuid.UUID | None = None,
    priority: str | None = None,
    assigned_to: uuid.UUID | None = None,
    scheduled_date: date | None = None,
    estimated_hours: float | None = None,
    notes: str | None = None,
) -> dict:
    """Actualiza una orden de trabajo existente."""
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = r.scalar_one_or_none()
    if not wo:
        raise NotFoundError("WorkOrder", wo_id)
    if asset_id:
        r2 = await db.execute(select(Asset).where(Asset.id == asset_id))
        if not r2.scalar_one_or_none():
            raise NotFoundError("Asset", asset_id)
    if assigned_to:
        r3 = await db.execute(select(User).where(User.id == assigned_to))
        if not r3.scalar_one_or_none():
            raise NotFoundError("User", assigned_to)
    if title is not None:
        wo.title = title
    if description is not None:
        wo.description = description
    if asset_id is not None:
        wo.asset_id = asset_id
    if priority is not None:
        wo.priority = priority
    if assigned_to is not None:
        wo.assigned_to = assigned_to
    if scheduled_date is not None:
        wo.scheduled_date = scheduled_date
    if estimated_hours is not None:
        wo.estimated_hours = estimated_hours
    if notes is not None:
        wo.notes = notes
    await db.commit()
    await db.refresh(wo)
    an = tn = None
    if wo.asset_id:
        r4 = await db.execute(select(Asset.name).where(Asset.id == wo.asset_id))
        an = r4.scalar_one_or_none()
    if wo.assigned_to:
        r5 = await db.execute(select(User.full_name).where(User.id == wo.assigned_to))
        tn = r5.scalar_one_or_none()
    return _wo_to_dict(wo, an, tn)


# ─── DELETE ───────────────────────────────────────────────

async def delete_work_order(db: AsyncSession, wo_id: uuid.UUID) -> dict:
    """Elimina una orden de trabajo."""
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = r.scalar_one_or_none()
    if not wo:
        raise NotFoundError("WorkOrder", wo_id)
    await db.execute(delete(WorkOrderPart).where(WorkOrderPart.work_order_id == wo_id))
    await db.execute(delete(WorkOrderStatusHistory).where(WorkOrderStatusHistory.work_order_id == wo_id))
    await db.delete(wo)
    await db.commit()
    return {"message": f"WorkOrder {wo.wo_number} deleted"}


# ─── CHANGE STATUS ────────────────────────────────────────

async def change_status(
    db: AsyncSession,
    wo_id: uuid.UUID,
    new_status: str,
    changed_by: uuid.UUID | None = None,
) -> dict:
    """Cambia el estado de una orden de trabajo con validación."""
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = r.scalar_one_or_none()
    if not wo:
        raise NotFoundError("WorkOrder", wo_id)
    allowed = VALID_TRANSITIONS.get(wo.status, [])
    if new_status not in allowed:
        raise ValidationError(
            f"Cannot transition from {wo.status} to {new_status}. Allowed: {allowed}"
        )
    old_status = wo.status
    wo.status = new_status
    if new_status == "IN_PROGRESS" and not wo.start_date:
        wo.start_date = datetime.utcnow()
    if new_status == "COMPLETED" and not wo.completed_date:
        wo.completed_date = datetime.utcnow()
    history = WorkOrderStatusHistory(
        work_order_id=wo_id, old_status=old_status,
        new_status=new_status, changed_by=changed_by,
    )
    db.add(history)
    await db.commit()
    await db.refresh(wo)

    # FASE 6.2: Integración automática con NotificationService para WORK_ORDER_ASSIGNED
    if old_status == "OPEN" and wo.status == "ASSIGNED":
        try:
            from app.infrastructure.notifications.notification_service import NotificationService
            notification_service = NotificationService()
            await notification_service.send_work_order_assigned(db, wo, tech)
        except Exception as e:
            import logging
            logging.error(f"Failed to send work order assigned notification: {e}")

    an = None
    if wo.asset_id:
        r2 = await db.execute(select(Asset.name).where(Asset.id == wo.asset_id))
        an = r2.scalar_one_or_none()
    return _wo_to_dict(wo, an, tech.full_name)


# ─── CHANGE STATUS ────────────────────────────────────────

async def change_status(
    db: AsyncSession,
    wo_id: uuid.UUID,
    new_status: str,
    changed_by: uuid.UUID | None = None,
) -> dict:
    """Cambia el estado de una orden de trabajo con validación."""
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = r.scalar_one_or_none()
    if not wo:
        raise NotFoundError("WorkOrder", wo_id)
    allowed = VALID_TRANSITIONS.get(wo.status, [])
    if new_status not in allowed:
        raise ValidationError(
            f"Cannot transition from {wo.status} to {new_status}. Allowed: {allowed}"
        )
    old_status = wo.status
    wo.status = new_status
    if new_status == "IN_PROGRESS" and not wo.start_date:
        wo.start_date = datetime.utcnow()
    if new_status == "COMPLETED" and not wo.completed_date:
        wo.completed_date = datetime.utcnow()
    history = WorkOrderStatusHistory(
        work_order_id=wo_id, old_status=old_status,
        new_status=new_status, changed_by=changed_by,
    )
    db.add(history)
    await db.commit()
    await db.refresh(wo)

    # FASE 6.2: Integración automática con NotificationService para COMPLETED/CANCELLED
    if new_status in ("COMPLETED", "CANCELLED"):
        try:
            from app.infrastructure.notifications.notification_service import NotificationService
            notification_service = NotificationService()
            await notification_service.send_work_order_status_changed(db, wo, new_status)
        except Exception as e:
            import logging
            logging.error(f"Failed to send work order status changed notification: {e}")

    an = tn = None
    if wo.asset_id:
        r2 = await db.execute(select(Asset.name).where(Asset.id == wo.asset_id))
        an = r2.scalar_one_or_none()
    if wo.assigned_to:
        r3 = await db.execute(select(User.full_name).where(User.id == wo.assigned_to))
        tn = r3.scalar_one_or_none()
    return _wo_to_dict(wo, an, tn)

        r3 = await db.execute(select(Asset.name).where(Asset.id == wo.asset_id))
        an = r3.scalar_one_or_none()
    return _wo_to_dict(wo, an, tech.full_name)


# ─── ADD PART ─────────────────────────────────────────────

async def add_part(
    db: AsyncSession,
    wo_id: uuid.UUID,
    part_id: uuid.UUID,
    quantity: int,
    added_by: uuid.UUID | None = None,
) -> dict:
    """Agrega un repuesto consumido a una orden de trabajo."""
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = r.scalar_one_or_none()
    if not wo:
        raise NotFoundError("WorkOrder", wo_id)
    r2 = await db.execute(select(Part).where(Part.id == part_id))
    part = r2.scalar_one_or_none()
    if not part:
        raise NotFoundError("Part", part_id)
    # P0-02: Verificar duplicado antes de descontar stock
    existing = await db.execute(
        select(WorkOrderPart).where(
            (WorkOrderPart.work_order_id == wo_id) &
            (WorkOrderPart.part_id == part_id)
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(
            f"Part {part.part_number} already added to this work order."
        )
    if part.current_stock < quantity:
        raise ValidationError(
            f"Insufficient stock for part {part.part_number}. Current: {part.current_stock}, Requested: {quantity}"
        )
    wo_part = WorkOrderPart(
        work_order_id=wo_id, part_id=part_id,
        quantity=quantity, unit_cost=part.unit_cost,
    )
    db.add(wo_part)
    part.current_stock -= quantity
    movement = StockMovement(
        part_id=part_id, movement_type="OUT",
        quantity=quantity, reason=f"Work Order {wo.wo_number}",
        performed_by=added_by, performed_at=datetime.utcnow(),
    )
    db.add(movement)
    await db.commit()
    await db.refresh(wo_part)
    return {
        "id": str(wo_part.id),
        "work_order_id": str(wo_id),
        "part_id": str(part_id),
        "part_number": part.part_number,
        "part_name": part.name,
        "quantity": wo_part.quantity,
        "unit_cost": wo_part.unit_cost,
        "total_cost": wo_part.quantity * wo_part.unit_cost,
    }


# ─── REMOVE PART ──────────────────────────────────────────

async def remove_part(
    db: AsyncSession,
    wo_id: uuid.UUID,
    wo_part_id: uuid.UUID,
    removed_by: uuid.UUID | None = None,
) -> dict:
    """Elimina un repuesto de una orden y devuelve stock."""
    r = await db.execute(select(WorkOrderPart).where(WorkOrderPart.id == wo_part_id))
    wo_part = r.scalar_one_or_none()
    if not wo_part:
        raise NotFoundError("WorkOrderPart", wo_part_id)
    if wo_part.work_order_id != wo_id:
        raise ValidationError("Part does not belong to this Work Order")
    r2 = await db.execute(select(Part).where(Part.id == wo_part.part_id))
    part = r2.scalar_one_or_none()
    if part:
        part.current_stock += wo_part.quantity
        movement = StockMovement(
            part_id=part.id, movement_type="ADJUSTMENT",
            quantity=wo_part.quantity, reason="Return from Work Order removal",
            performed_by=removed_by, performed_at=datetime.utcnow(),
        )
        db.add(movement)
    await db.delete(wo_part)
    await db.commit()
    return {"message": "Part removed from work order"}


# ─── GET STATUS HISTORY ───────────────────────────────────

async def get_status_history(db: AsyncSession, wo_id: uuid.UUID) -> list[dict]:
    """Historial de cambios de estado."""
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = r.scalar_one_or_none()
    if not wo:
        raise NotFoundError("WorkOrder", wo_id)
    r2 = await db.execute(
        select(WorkOrderStatusHistory)
        .where(WorkOrderStatusHistory.work_order_id == wo_id)
        .order_by(WorkOrderStatusHistory.changed_at.desc())
    )
    histories = r2.scalars().all()
    result = []
    for h in histories:
        changer_name = None
        if h.changed_by:
            r3 = await db.execute(select(User.full_name).where(User.id == h.changed_by))
            changer_name = r3.scalar_one_or_none()
        result.append({
            "id": str(h.id), "work_order_id": str(h.work_order_id),
            "old_status": h.old_status, "new_status": h.new_status,
            "changed_by": str(h.changed_by) if h.changed_by else None,
            "changer_name": changer_name, "changed_at": h.changed_at.isoformat(),
        })
    return result


# ─── GET PARTS ────────────────────────────────────────────

async def get_parts(db: AsyncSession, wo_id: uuid.UUID) -> list[dict]:
    """Repuestos consumidos en una orden."""
    r = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = r.scalar_one_or_none()
    if not wo:
        raise NotFoundError("WorkOrder", wo_id)
    r2 = await db.execute(select(WorkOrderPart).where(WorkOrderPart.work_order_id == wo_id))
    parts = r2.scalars().all()
    result = []
    for wp in parts:
        r3 = await db.execute(select(Part).where(Part.id == wp.part_id))
        part = r3.scalar_one_or_none()
        result.append({
            "id": str(wp.id), "work_order_id": str(wp.work_order_id),
            "part_id": str(wp.part_id),
            "part_number": part.part_number if part else None,
            "part_name": part.name if part else None,
            "quantity": wp.quantity, "unit_cost": wp.unit_cost,
            "total_cost": wp.quantity * wp.unit_cost,
        })
    return result
