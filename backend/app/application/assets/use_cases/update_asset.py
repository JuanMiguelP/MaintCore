"""Use Case: Actualizar un Asset."""

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.assets.asset import Asset
from app.domain.assets.category import AssetCategory
from app.domain.assets.location import Location
from app.shared.exceptions import NotFoundError


async def update_asset(
    db: AsyncSession,
    asset_id: uuid.UUID,
    name: str | None = None,
    description: str | None = None,
    category_id: uuid.UUID | None = None,
    location_id: uuid.UUID | None = None,
    manufacturer: str | None = None,
    model: str | None = None,
    serial_number: str | None = None,
    purchase_date=None,
    status: str | None = None,
    notes: str | None = None,
) -> dict:
    """Actualiza un activo existente. Solo actualiza campos no-None."""
    # Verificar existencia del asset
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise NotFoundError("Asset", asset_id)

    # Validar category si se proporciona
    if category_id:
        cat_result = await db.execute(select(AssetCategory).where(AssetCategory.id == category_id))
        if not cat_result.scalar_one_or_none():
            raise NotFoundError("AssetCategory", category_id)

    # Validar location si se proporciona
    if location_id:
        loc_result = await db.execute(select(Location).where(Location.id == location_id))
        if not loc_result.scalar_one_or_none():
            raise NotFoundError("Location", location_id)

    # Construir update dict (solo campos no-None)
    updates = {}
    for field in ["name", "description", "category_id", "location_id", "manufacturer",
                  "model", "serial_number", "purchase_date", "status", "notes"]:
        value = locals().get(field)
        if value is not None:
            updates[field] = value

    if updates:
        await db.execute(update(Asset).where(Asset.id == asset_id).values(**updates))
        await db.commit()

    # Recargar y retornar
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one()

    return {
        "id": str(asset.id),
        "code": asset.code,
        "name": asset.name,
        "description": asset.description,
        "category_name": None,
        "location_name": None,
        "manufacturer": asset.manufacturer,
        "model": asset.model,
        "serial_number": asset.serial_number,
        "purchase_date": asset.purchase_date.isoformat() if asset.purchase_date else None,
        "status": asset.status,
        "notes": asset.notes,
        "created_at": asset.created_at.isoformat(),
        "updated_at": asset.updated_at.isoformat(),
    }
