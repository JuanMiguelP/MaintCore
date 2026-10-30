"""Use Case: Listar Assets con paginaci\u00f3n y filtros."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.assets.asset import Asset
from app.domain.assets.category import AssetCategory
from app.domain.assets.location import Location


async def list_assets(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    category_id: uuid.UUID | None = None,
    location_id: uuid.UUID | None = None,
    status: str | None = None,
) -> dict:
    """Lista activos con paginaci\u00f3n y filtros opcionales."""
    base_query = (
        select(Asset, AssetCategory.name.label("category_name"), Location.name.label("location_name"))
        .outerjoin(AssetCategory, Asset.category_id == AssetCategory.id)
        .outerjoin(Location, Asset.location_id == Location.id)
    )

    # Aplicar filtros
    if search:
        like = f"%{search}%"
        base_query = base_query.where(
            (Asset.code.ilike(like)) | (Asset.name.ilike(like)) | (Asset.serial_number.ilike(like))
        )
    if category_id:
        base_query = base_query.where(Asset.category_id == category_id)
    if location_id:
        base_query = base_query.where(Asset.location_id == location_id)
    if status:
        base_query = base_query.where(Asset.status == status)

    # Total
    count_stmt = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    # Paginaci\u00f3n
    items_query = base_query.order_by(Asset.code).offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_query)
    rows = items_result.all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": [
            {
                "id": str(r[0].id),
                "code": r[0].code,
                "name": r[0].name,
                "description": r[0].description,
                "category_name": r[1],
                "location_name": r[2],
                "manufacturer": r[0].manufacturer,
                "model": r[0].model,
                "serial_number": r[0].serial_number,
                "purchase_date": r[0].purchase_date.isoformat() if r[0].purchase_date else None,
                "status": r[0].status,
                "notes": r[0].notes,
                "created_at": r[0].created_at.isoformat(),
                "updated_at": r[0].updated_at.isoformat(),
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
