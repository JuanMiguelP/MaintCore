"""Router de Locations — capa de presentaci\u00f3n."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.locations.use_cases.location_use_cases import create_location, update_location, delete_location, list_locations
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_location(body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        parent_id = UUID(body["parent_id"]) if body.get("parent_id") else None
        return await create_location(db, name=body["name"], code=body.get("code"), parent_id=parent_id, address=body.get("address"))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("")
async def get_locations(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), search: str | None = Query(None), db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    return await list_locations(db, page=page, page_size=page_size, search=search)


@router.get("/{location_id}")
async def get_location_by_id(location_id: str, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        result = await list_locations(db, page=1, page_size=1000)
        for item in result["items"]:
            if item["id"] == location_id:
                return item
        raise HTTPException(status_code=404, detail="Location not found")
    except HTTPException:
        raise


@router.put("/{location_id}")
async def update_location_by_id(location_id: str, body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        parent_id = UUID(body["parent_id"]) if body.get("parent_id") else None
        return await update_location(db, UUID(location_id), name=body.get("name"), code=body.get("code"), parent_id=parent_id, address=body.get("address"), is_active=body.get("is_active"))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location_by_id(location_id: str, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        await delete_location(db, UUID(location_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
