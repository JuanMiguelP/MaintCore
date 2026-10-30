"""Router de Categories — capa de presentaci\u00f3n."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.categories.use_cases.category_use_cases import create_category, update_category, delete_category, list_categories
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError, ConflictError

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_category(body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        return await create_category(db, name=body["name"], description=body.get("description"))
    except ConflictError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("")
async def get_categories(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), search: str | None = Query(None), db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    return await list_categories(db, page=page, page_size=page_size, search=search)


@router.get("/{category_id}")
async def get_category_by_id(category_id: str, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        result = await list_categories(db, page=1, page_size=1000)
        for item in result["items"]:
            if item["id"] == category_id:
                return item
        raise HTTPException(status_code=404, detail="Category not found")
    except HTTPException:
        raise


@router.put("/{category_id}")
async def update_category_by_id(category_id: str, body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        return await update_category(db, UUID(category_id), name=body.get("name"), description=body.get("description"))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category_by_id(category_id: str, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        await delete_category(db, UUID(category_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
