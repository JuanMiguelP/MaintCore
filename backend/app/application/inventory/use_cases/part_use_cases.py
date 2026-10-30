"""Use Cases del dominio de Parts."""

import uuid
from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.inventory.part import Part
from app.domain.inventory.supplier import Supplier
from app.domain.inventory.part_change_log import PartChangeLog
from app.shared.exceptions import NotFoundError, ConflictError

EDITABLE_FIELDS = (
    "part_number", "name", "description", "manufacturer",
    "supplier_id", "unit_cost", "minimum_stock", "current_stock",
    "location", "notes",
)


def _serialize_value(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _detect_changes(part: Part, updates: dict) -> list[dict]:
    changes = []
    for field in EDITABLE_FIELDS:
        if field not in updates:
            continue
        new_val = updates[field]
        old_val = getattr(part, field, None)
        if old_val != new_val:
            changes.append({
                "field_name": field,
                "old_value": _serialize_value(old_val),
                "new_value": _serialize_value(new_val),
            })
    return changes


async def log_changes(
    db: AsyncSession,
    part_id: uuid.UUID,
    changes: list[dict],
    performed_by: uuid.UUID | None,
) -> None:
    if not changes:
        return
    entries = [
        PartChangeLog(
            part_id=part_id,
            field_name=c["field_name"],
            old_value=c["old_value"],
            new_value=c["new_value"],
            performed_by=performed_by,
        )
        for c in changes
    ]
    db.add_all(entries)
    await db.commit()


async def create_part(db: AsyncSession, part_number: str, name: str, description: str | None = None, manufacturer: str | None = None, supplier_id: uuid.UUID | None = None, unit_cost: float = 0.0, minimum_stock: int = 0, current_stock: int = 0, location: str | None = None, notes: str | None = None) -> dict:
    existing = await db.execute(select(Part).where(Part.part_number == part_number))
    if existing.scalar_one_or_none():
        raise ConflictError(f"Part number '{part_number}' already exists")
    if supplier_id:
        cat_result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
        if not cat_result.scalar_one_or_none():
            raise NotFoundError("Supplier", supplier_id)
    part = Part(part_number=part_number, name=name, description=description, manufacturer=manufacturer, supplier_id=supplier_id, unit_cost=unit_cost, minimum_stock=minimum_stock, current_stock=current_stock, location=location, notes=notes)
    db.add(part)
    await db.commit()
    await db.refresh(part)
    return _part_to_dict(part)


async def update_part(db: AsyncSession, part_id: uuid.UUID, part_number: str | None = None, name: str | None = None, description: str | None = None, manufacturer: str | None = None, supplier_id: uuid.UUID | None = None, unit_cost: float | None = None, minimum_stock: int | None = None, current_stock: int | None = None, location: str | None = None, notes: str | None = None, performed_by: uuid.UUID | None = None) -> dict:
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one_or_none()
    if not part:
        raise NotFoundError("Part", part_id)
    if part_number and part_number != part.part_number:
        existing = await db.execute(select(Part).where(Part.part_number == part_number))
        if existing.scalar_one_or_none():
            raise ConflictError(f"Part number '{part_number}' already exists")
    if supplier_id is not None:
        cat_result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
        if not cat_result.scalar_one_or_none():
            raise NotFoundError("Supplier", supplier_id)
    updates = {k: v for k, v in {"part_number": part_number, "name": name, "description": description, "manufacturer": manufacturer, "supplier_id": supplier_id, "unit_cost": unit_cost, "minimum_stock": minimum_stock, "current_stock": current_stock, "location": location, "notes": notes}.items() if v is not None}
    if updates:
        changes = _detect_changes(part, updates)
        await db.execute(update(Part).where(Part.id == part_id).values(**updates))
        await db.commit()
        await log_changes(db, part_id, changes, performed_by)
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one()
    return _part_to_dict(part)


async def delete_part(db: AsyncSession, part_id: uuid.UUID) -> dict:
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one_or_none()
    if not part:
        raise NotFoundError("Part", part_id)
    await db.delete(part)
    await db.commit()
    return {"message": f"Part '{part.part_number}' deleted"}


async def list_parts(db: AsyncSession, page: int = 1, page_size: int = 20, search: str | None = None, supplier_id: uuid.UUID | None = None, low_stock: bool = False) -> dict:
    base_query = select(Part)
    if search:
        like = f"%{search}%"
        base_query = base_query.where((Part.part_number.ilike(like)) | (Part.name.ilike(like)))
    if supplier_id:
        base_query = base_query.where(Part.supplier_id == supplier_id)
    if low_stock:
        base_query = base_query.where(Part.current_stock <= Part.minimum_stock)
    total_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = total_result.scalar()
    items_query = base_query.order_by(Part.part_number).offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_query)
    parts = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {"items": [_part_to_dict(p) for p in parts], "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


async def get_low_stock_parts(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Part).where(Part.current_stock <= Part.minimum_stock).order_by(Part.current_stock))
    parts = result.scalars().all()
    return [_part_to_dict(p) for p in parts]


async def get_inventory_valuation(db: AsyncSession) -> dict:
    result = await db.execute(select(Part))
    parts = result.scalars().all()
    total_value = sum(p.unit_cost * p.current_stock for p in parts)
    total_parts = len(parts)
    low_stock_count = sum(1 for p in parts if p.current_stock <= p.minimum_stock)
    return {"total_parts": total_parts, "total_value": round(total_value, 2), "low_stock_count": low_stock_count, "currency": "EUR"}


def _part_to_dict(part: Part) -> dict:
    return {"id": str(part.id), "part_number": part.part_number, "name": part.name, "description": part.description, "manufacturer": part.manufacturer, "supplier_name": None, "unit_cost": part.unit_cost, "minimum_stock": part.minimum_stock, "current_stock": part.current_stock, "location": part.location, "notes": part.notes, "is_low_stock": part.current_stock <= part.minimum_stock, "created_at": part.created_at.isoformat(), "updated_at": part.updated_at.isoformat()}