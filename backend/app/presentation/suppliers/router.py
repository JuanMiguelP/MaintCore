"""Router de Suppliers — capa de presentaci\u00f3n."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.suppliers.use_cases.supplier_use_cases import create_supplier, update_supplier, delete_supplier, list_suppliers
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError, ConflictError

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_supplier(body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        return await create_supplier(db, name=body["name"], tax_id=body.get("tax_id"), contact_person=body.get("contact_person"), email=body.get("email"), phone=body.get("phone"), address=body.get("address"), notes=body.get("notes"))
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("")
async def get_suppliers(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: str | None = Query(None), db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    return await list_suppliers(db, page=page, page_size=page_size, search=search)


@router.get("/{supplier_id}")
async def get_supplier_by_id(supplier_id: str, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        result = await list_suppliers(db, page=1, page_size=1000)
        for item in result["items"]:
            if item["id"] == supplier_id:
                return item
        raise HTTPException(status_code=404, detail="Supplier not found")
    except HTTPException:
        raise


@router.put("/{supplier_id}")
async def update_supplier_by_id(supplier_id: str, body: dict, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        return await update_supplier(db, UUID(supplier_id), name=body.get("name"), tax_id=body.get("tax_id"), contact_person=body.get("contact_person"), email=body.get("email"), phone=body.get("phone"), address=body.get("address"), notes=body.get("notes"))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier_by_id(supplier_id: str, db: AsyncSession = Depends(get_db), _current_user = Depends(get_current_user)):
    try:
        await delete_supplier(db, UUID(supplier_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
