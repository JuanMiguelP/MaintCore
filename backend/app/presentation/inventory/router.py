"""Router de Inventory (Parts + StockMovements + Reporting) — capa de presentaci\u00f3n."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.inventory.use_cases.part_use_cases import create_part, update_part, delete_part, list_parts, get_low_stock_parts, get_inventory_valuation
from app.application.inventory.use_cases.stock_movement_use_cases import create_stock_movement, list_stock_movements
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError, ConflictError, ValidationError

router = APIRouter(prefix="/inventory", tags=["Inventory"])


# ---- Parts ----

@router.post("/parts", status_code=status.HTTP_201_CREATED)
async def create_new_part(body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        supplier_id = UUID(body["supplier_id"]) if body.get("supplier_id") else None
        return await create_part(db, part_number=body["part_number"], name=body["name"], description=body.get("description"), manufacturer=body.get("manufacturer"), supplier_id=supplier_id, unit_cost=float(body.get("unit_cost", 0)), minimum_stock=int(body.get("minimum_stock", 0)), current_stock=int(body.get("current_stock", 0)), location=body.get("location"), notes=body.get("notes"))
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/parts")
async def get_parts(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: str | None = Query(None), supplier_id: str | None = Query(None), low_stock: bool = Query(False), db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    sup_id = UUID(supplier_id) if supplier_id else None
    return await list_parts(db, page=page, page_size=page_size, search=search, supplier_id=sup_id, low_stock=low_stock)


@router.get("/parts/low-stock")
async def get_low_stock(_current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_low_stock_parts(db)


@router.get("/parts/{part_id}")
async def get_part_by_id(part_id: str, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        result = await list_parts(db, page=1, page_size=1000)
        for item in result["items"]:
            if item["id"] == part_id:
                return item
        raise HTTPException(status_code=404, detail="Part not found")
    except HTTPException:
        raise


@router.put("/parts/{part_id}")
async def update_part_by_id(part_id: str, body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        supplier_id = UUID(body["supplier_id"]) if body.get("supplier_id") else None
        return await update_part(db, UUID(part_id), part_number=body.get("part_number"), name=body.get("name"), description=body.get("description"), manufacturer=body.get("manufacturer"), supplier_id=supplier_id, unit_cost=body.get("unit_cost"), minimum_stock=body.get("minimum_stock"), current_stock=body.get("current_stock"), location=body.get("location"), notes=body.get("notes"), performed_by=getattr(_current_user, "id", None))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/parts/{part_id}/change-history")
async def get_part_change_history(part_id: str, page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    from app.domain.inventory.part_change_log import PartChangeLog
    from sqlalchemy import func as sa_func
    base_query = select(PartChangeLog).where(PartChangeLog.part_id == UUID(part_id)).order_by(PartChangeLog.created_at.desc())
    total_result = await db.execute(select(sa_func.count()).select_from(base_query.subquery()))
    total = total_result.scalar()
    items_query = base_query.offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_query)
    logs = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {
        "items": [
            {
                "id": str(l.id),
                "field_name": l.field_name,
                "old_value": l.old_value,
                "new_value": l.new_value,
                "performed_by": str(l.performed_by) if l.performed_by else None,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.delete("/parts/{part_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_part_by_id(part_id: str, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        await delete_part(db, UUID(part_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ---- Stock Movements ----

@router.post("/movements", status_code=status.HTTP_201_CREATED)
async def create_movement(body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        performed_by = getattr(_current_user, "id", None)
        return await create_stock_movement(db, part_id=UUID(body["part_id"]), movement_type=body["movement_type"], quantity=int(body["quantity"]), reason=body.get("reason"), performed_by=performed_by)
    except (NotFoundError, ValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/movements")
async def get_movements(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), part_id: str | None = Query(None), movement_type: str | None = Query(None), db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    pid = UUID(part_id) if part_id else None
    return await list_stock_movements(db, page=page, page_size=page_size, part_id=pid, movement_type=movement_type)


# ---- Reporting ----

@router.get("/valuation")
async def valuation(_current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_inventory_valuation(db)
