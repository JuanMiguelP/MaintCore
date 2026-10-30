"""Use Case: Eliminar un Asset."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.assets.asset import Asset
from app.shared.exceptions import NotFoundError


async def delete_asset(db: AsyncSession, asset_id: uuid.UUID) -> dict:
    """Elimina un activo. Lanza NotFoundError si no existe."""
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise NotFoundError("Asset", asset_id)

    await db.delete(asset)
    await db.commit()

    return {"message": f"Asset '{asset.code}' eliminado"}
