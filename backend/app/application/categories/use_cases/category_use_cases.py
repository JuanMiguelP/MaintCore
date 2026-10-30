"""Use Cases del dominio de Categories."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.assets.category import AssetCategory
from app.shared.exceptions import NotFoundError, ConflictError


async def create_category(db: AsyncSession, name: str, description: str | None = None) -> dict:
    existing = await db.execute(select(AssetCategory).where(AssetCategory.name == name))
    if existing.scalar_one_or_none():
        raise ConflictError(f"Category '{name}' already exists")

    cat = AssetCategory(name=name, description=description)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)

    return {"id": str(cat.id), "name": cat.name, "description": cat.description, "created_at": cat.created_at.isoformat()}


async def update_category(db: AsyncSession, category_id: uuid.UUID, name: str | None = None, description: str | None = None) -> dict:
    result = await db.execute(select(AssetCategory).where(AssetCategory.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise NotFoundError("AssetCategory", category_id)

    if name:
        existing = await db.execute(select(AssetCategory).where(AssetCategory.name == name, AssetCategory.id != category_id))
        if existing.scalar_one_or_none():
            raise ConflictError(f"Category '{name}' already exists")
        cat.name = name
    if description is not None:
        cat.description = description

    await db.commit()
    await db.refresh(cat)
    return {"id": str(cat.id), "name": cat.name, "description": cat.description, "created_at": cat.created_at.isoformat()}


async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> dict:
    result = await db.execute(select(AssetCategory).where(AssetCategory.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise NotFoundError("AssetCategory", category_id)

    await db.delete(cat)
    await db.commit()
    return {"message": f"Category '{cat.name}' deleted"}


async def list_categories(db: AsyncSession, page: int = 1, page_size: int = 50, search: str | None = None) -> dict:
    base_query = select(AssetCategory)
    if search:
        like = f"%{search}%"
        base_query = base_query.where(AssetCategory.name.ilike(like))

    total_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = total_result.scalar()

    items_query = base_query.order_by(AssetCategory.name).offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_query)
    categories = items_result.scalars().all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": [{"id": str(c.id), "name": c.name, "description": c.description, "created_at": c.created_at.isoformat()} for c in categories],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
