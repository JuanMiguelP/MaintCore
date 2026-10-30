"""Use Case: Obtener un Asset por ID."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.assets.asset import Asset
from app.domain.assets.category import AssetCategory
from app.domain.assets.location import Location
from app.shared.exceptions import NotFoundError


async def get_asset(db: AsyncSession, asset_id: uuid.UUID) -> dict:
    """Obtiene un activo con su categoría y ubicación."""
    stmt = (
        select(Asset, AssetCategory.name.label("category_name"), Location.name.label("location_name"))
        .outerjoin(AssetCategory, Asset.category_id == AssetCategory.id)
        .outerjoin(Location, Asset.location_id == Location.id)
        .where(Asset.id == asset_id)
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise NotFoundError("Asset", asset_id)

    asset, category_name, location_name = row

    return {
        "id": str(asset.id),
        "code": asset.code,
        "name": asset.name,
        "description": asset.description,
        "category_name": category_name,
        "location_name": location_name,
        "manufacturer": asset.manufacturer,
        "model": asset.model,
        "serial_number": asset.serial_number,
        "purchase_date": asset.purchase_date.isoformat() if asset.purchase_date else None,
        "status": asset.status,
        "notes": asset.notes,
        "created_at": asset.created_at.isoformat(),
        "updated_at": asset.updated_at.isoformat(),
    }
