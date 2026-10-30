"""Use Cases del dominio de Locations."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.assets.location import Location
from app.shared.exceptions import NotFoundError


async def create_location(db: AsyncSession, name: str, code: str | None = None, parent_id: uuid.UUID | None = None, address: str | None = None) -> dict:
    loc = Location(name=name, code=code, parent_id=parent_id, address=address)
    db.add(loc)
    await db.commit()
    await db.refresh(loc)

    return {"id": str(loc.id), "name": loc.name, "code": loc.code, "parent_id": str(loc.parent_id) if loc.parent_id else None, "address": loc.address, "is_active": loc.is_active, "created_at": loc.created_at.isoformat()}


async def update_location(db: AsyncSession, location_id: uuid.UUID, name: str | None = None, code: str | None = None, parent_id: uuid.UUID | None = None, address: str | None = None, is_active: bool | None = None) -> dict:
    result = await db.execute(select(Location).where(Location.id == location_id))
    loc = result.scalar_one_or_none()
    if not loc:
        raise NotFoundError("Location", location_id)

    if name is not None:
        loc.name = name
    if code is not None:
        loc.code = code
    if parent_id is not None:
        loc.parent_id = parent_id
    if address is not None:
        loc.address = address
    if is_active is not None:
        loc.is_active = is_active

    await db.commit()
    await db.refresh(loc)
    return {"id": str(loc.id), "name": loc.name, "code": loc.code, "parent_id": str(loc.parent_id) if loc.parent_id else None, "address": loc.address, "is_active": loc.is_active, "created_at": loc.created_at.isoformat()}


async def delete_location(db: AsyncSession, location_id: uuid.UUID) -> dict:
    result = await db.execute(select(Location).where(Location.id == location_id))
    loc = result.scalar_one_or_none()
    if not loc:
        raise NotFoundError("Location", location_id)

    await db.delete(loc)
    await db.commit()
    return {"message": f"Location '{loc.name}' deleted"}


async def list_locations(db: AsyncSession, page: int = 1, page_size: int = 50, search: str | None = None) -> dict:
    base_query = select(Location)
    if search:
        like = f"%{search}%"
        base_query = base_query.where((Location.name.ilike(like)) | (Location.code.ilike(like)))

    total_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = total_result.scalar()

    items_query = base_query.order_by(Location.name).offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_query)
    locations = items_result.scalars().all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": [{"id": str(l.id), "name": l.name, "code": l.code, "parent_id": str(l.parent_id) if l.parent_id else None, "address": l.address, "is_active": l.is_active, "created_at": l.created_at.isoformat()} for l in locations],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
