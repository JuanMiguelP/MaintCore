"""Router de Búsqueda Global Transversal."""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.domain.assets.asset import Asset
from app.domain.assets.category import AssetCategory
from app.domain.assets.location import Location as AssetLocation
from app.domain.inventory.part import Part
from app.domain.inventory.supplier import Supplier as InventorySupplier
from app.domain.work_orders.work_order import WorkOrder

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("")
async def global_search(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Búsqueda global transversal en Assets, Inventory, Work Orders, Suppliers y Locations.

    Respetando RBAC: solo devuelve resultados de módulos a los que el usuario tenga acceso.
    Límite: 5 resultados por módulo.
    """
    role = current_user.role_name

    # Determinar qué módulos buscar según permisos del usuario
    can_assets = role == "Admin" or _has_permission(current_user, "assets", "read")
    can_inventory = role == "Admin" or _has_permission(current_user, "inventory", "read")
    can_work_orders = role == "Admin" or _has_permission(current_user, "work_orders", "read")
    can_suppliers = role == "Admin" or _has_permission(current_user, "suppliers", "read")
    can_locations = role == "Admin" or _has_permission(current_user, "locations", "read")

    like = f"%{q}%"
    max_per_module = 5

    results = {
        "assets": [],
        "inventory": [],
        "work_orders": [],
        "suppliers": [],
        "locations": [],
    }

    # --- Assets ---
    if can_assets:
        stmt = (
            select(Asset, AssetCategory.name.label("category_name"), AssetLocation.name.label("location_name"))
            .outerjoin(AssetCategory, Asset.category_id == AssetCategory.id)
            .outerjoin(AssetLocation, Asset.location_id == AssetLocation.id)
            .where((Asset.code.ilike(like)) | (Asset.name.ilike(like)))
            .limit(max_per_module)
        )
        res = await db.execute(stmt)
        for r in res.all():
            results["assets"].append({
                "id": str(r[0].id),
                "code": r[0].code,
                "name": r[0].name,
                "category_name": r[1],
                "location_name": r[2],
            })

    # --- Inventory Parts ---
    if can_inventory:
        stmt = (
            select(Part)
            .where((Part.part_number.ilike(like)) | (Part.name.ilike(like)))
            .limit(max_per_module)
        )
        res = await db.execute(stmt)
        for row in res.scalars().all():
            results["inventory"].append({
                "id": str(row.id),
                "part_number": row.part_number,
                "name": row.name,
            })

    # --- Work Orders ---
    if can_work_orders:
        stmt = (
            select(WorkOrder)
            .where((WorkOrder.wo_number.ilike(like)) | (WorkOrder.title.ilike(like)))
            .limit(max_per_module)
        )
        res = await db.execute(stmt)
        for row in res.scalars().all():
            results["work_orders"].append({
                "id": str(row.id),
                "wo_number": row.wo_number,
                "title": row.title,
                "status": row.status,
            })

    # --- Suppliers ---
    if can_suppliers:
        stmt = (
            select(InventorySupplier)
            .where(InventorySupplier.name.ilike(like))
            .limit(max_per_module)
        )
        res = await db.execute(stmt)
        for row in res.scalars().all():
            results["suppliers"].append({
                "id": str(row.id),
                "name": row.name,
            })

    # --- Locations ---
    if can_locations:
        stmt = (
            select(AssetLocation)
            .where((AssetLocation.name.ilike(like)) | (AssetLocation.code.ilike(like)))
            .limit(max_per_module)
        )
        res = await db.execute(stmt)
        for row in res.scalars().all():
            results["locations"].append({
                "id": str(row.id),
                "name": row.name,
                "code": row.code,
            })

    return {
        "query": q,
        "results": results,
    }


def _has_permission(user, resource: str, action: str) -> bool:
    """Verificar si un usuario tiene un permiso específico."""
    if user.role_name == "Admin":
        return True
    for perm in user.permissions:
        if perm.resource == resource and perm.action == action:
            return True
    return False
