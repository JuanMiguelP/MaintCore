"""Use Cases del dominio de StockMovements."""

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.inventory.part import Part
from app.domain.inventory.stock_movement import StockMovement
from app.shared.exceptions import NotFoundError, ValidationError


async def create_stock_movement(db: AsyncSession, part_id: uuid.UUID, movement_type: str, quantity: int, reason: str | None = None, performed_by: uuid.UUID | None = None) -> dict:
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one_or_none()
    if not part:
        raise NotFoundError("Part", part_id)

    if movement_type == "OUT" and part.current_stock < quantity:
        raise ValidationError(f"Insufficient stock. Current: {part.current_stock}, Requested: {quantity}")

    movement = StockMovement(part_id=part_id, movement_type=movement_type, quantity=quantity, reason=reason, performed_by=performed_by, performed_at=datetime.utcnow())
    db.add(movement)

    if movement_type == "IN":
        part.current_stock += quantity
    elif movement_type == "OUT":
        part.current_stock -= quantity
    elif movement_type == "ADJUSTMENT":
        part.current_stock = quantity

    await db.commit()
    await db.refresh(movement)

    # FASE 6.1: Integración automática con NotificationService
    try:
        from app.infrastructure.notifications.notification_service import NotificationService
        notification_service = NotificationService()
        await notification_service.check_and_notify_low_stock(db, part)
    except Exception as e:
        import logging
        logging.error(f"Failed to check notifications for stock movement: {e}")

    return {"id": str(movement.id), "part_number": part.part_number, "part_name": part.name, "movement_type": movement.movement_type, "quantity": movement.quantity, "reason": movement.reason, "performed_by": str(performed_by) if performed_by else None, "performed_at": movement.performed_at.isoformat()}


async def list_stock_movements(db: AsyncSession, page: int = 1, page_size: int = 20, part_id: uuid.UUID | None = None, movement_type: str | None = None) -> dict:
    from sqlalchemy import func
    base_query = select(StockMovement)
    if part_id:
        base_query = base_query.where(StockMovement.part_id == part_id)
    if movement_type:
        base_query = base_query.where(StockMovement.movement_type == movement_type)
    total_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = total_result.scalar()
    items_query = base_query.order_by(StockMovement.performed_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_query)
    movements = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {"items": [{"id": str(m.id), "part_number": None, "part_name": None, "movement_type": m.movement_type, "quantity": m.quantity, "reason": m.reason, "performed_by": str(m.performed_by) if m.performed_by else None, "performed_at": m.performed_at.isoformat()} for m in movements], "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}
