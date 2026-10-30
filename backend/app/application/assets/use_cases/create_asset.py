"""Use Case: Crear un nuevo Asset."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.assets.asset import Asset
from app.domain.assets.category import AssetCategory
from app.domain.assets.location import Location
from app.shared.exceptions import NotFoundError, ConflictError


async def create_asset(
    db: AsyncSession,
    code: str,
    name: str,
    category_id: uuid.UUID,
    description: str | None = None,
    location_id: uuid.UUID | None = None,
    manufacturer: str | None = None,
    model: str | None = None,
    serial_number: str | None = None,
    purchase_date=None,
    status: str = "ACTIVE",
    notes: str | None = None,
) -> dict:
    """Crea un nuevo activo en el sistema.

    Valida unicidad de code, existencia de category y location.
    """
    # Verificar unicidad de code
    existing = await db.execute(select(Asset).where(Asset.code == code))
    if existing.scalar_one_or_none():
        raise ConflictError(f"Asset code '{code}' already exists")

    # Verificar existencia de category
    cat_result = await db.execute(select(AssetCategory).where(AssetCategory.id == category_id))
    if not cat_result.scalar_one_or_none():
        raise NotFoundError("AssetCategory", category_id)

    # Verificar existencia de location si se proporciona
    if location_id:
        loc_result = await db.execute(select(Location).where(Location.id == location_id))
        if not loc_result.scalar_one_or_none():
            raise NotFoundError("Location", location_id)

    asset = Asset(
        code=code,
        name=name,
        description=description,
        category_id=category_id,
        location_id=location_id,
        manufacturer=manufacturer,
        model=model,
        serial_number=serial_number,
        purchase_date=purchase_date,
        status=status,
        notes=notes,
    )

    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return {
        "id": str(asset.id),
        "code": asset.code,
        "name": asset.name,
        "description": asset.description,
        "category_name": None,  # Se carga en list/get
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
