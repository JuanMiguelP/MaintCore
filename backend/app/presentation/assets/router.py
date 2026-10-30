"""Router de Assets — capa de presentaci\u00f3n."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.assets.use_cases.create_asset import create_asset
from app.application.assets.use_cases.update_asset import update_asset
from app.application.assets.use_cases.delete_asset import delete_asset
from app.application.assets.use_cases.get_asset import get_asset
from app.application.assets.use_cases.list_assets import list_assets
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError, ConflictError

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_asset(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        result = await create_asset(
            db,
            code=body["code"],
            name=body["name"],
            category_id=UUID(body["category_id"]),
            description=body.get("description"),
            location_id=UUID(body["location_id"]) if body.get("location_id") else None,
            manufacturer=body.get("manufacturer"),
            model=body.get("model"),
            serial_number=body.get("serial_number"),
            purchase_date=body.get("purchase_date"),
            status=body.get("status", "ACTIVE"),
            notes=body.get("notes"),
        )
        return result
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("")
async def get_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    category_id: str | None = Query(None),
    location_id: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    cat_uuid = UUID(category_id) if category_id else None
    loc_uuid = UUID(location_id) if location_id else None
    return await list_assets(db, page=page, page_size=page_size, search=search, category_id=cat_uuid, location_id=loc_uuid, status=status)


@router.get("/{asset_id}")
async def get_asset_by_id(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await get_asset(db, UUID(asset_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{asset_id}")
async def update_asset_by_id(
    asset_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        purchase_date = body.get("purchase_date")
        if isinstance(purchase_date, str):
            from datetime import date
            purchase_date = date.fromisoformat(purchase_date)

        result = await update_asset(
            db,
            asset_id=UUID(asset_id),
            name=body.get("name"),
            description=body.get("description"),
            category_id=UUID(body["category_id"]) if body.get("category_id") else None,
            location_id=UUID(body["location_id"]) if body.get("location_id") else None,
            manufacturer=body.get("manufacturer"),
            model=body.get("model"),
            serial_number=body.get("serial_number"),
            purchase_date=purchase_date,
            status=body.get("status"),
            notes=body.get("notes"),
        )
        return result
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset_by_id(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        await delete_asset(db, UUID(asset_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
