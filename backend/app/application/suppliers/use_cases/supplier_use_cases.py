"""Use Cases del dominio de Suppliers."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.inventory.supplier import Supplier
from app.shared.exceptions import NotFoundError, ConflictError


async def create_supplier(db: AsyncSession, name: str, tax_id: str | None = None, contact_person: str | None = None, email: str | None = None, phone: str | None = None, address: str | None = None, notes: str | None = None) -> dict:
    if tax_id:
        existing = await db.execute(select(Supplier).where(Supplier.tax_id == tax_id))
        if existing.scalar_one_or_none():
            raise ConflictError(f"Tax ID '{tax_id}' already exists")
    supplier = Supplier(name=name, tax_id=tax_id, contact_person=contact_person, email=email, phone=phone, address=address, notes=notes)
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return {"id": str(supplier.id), "name": supplier.name, "tax_id": supplier.tax_id, "contact_person": supplier.contact_person, "email": supplier.email, "phone": supplier.phone, "address": supplier.address, "notes": supplier.notes, "created_at": supplier.created_at.isoformat(), "updated_at": supplier.updated_at.isoformat()}


async def update_supplier(db: AsyncSession, supplier_id: uuid.UUID, name: str | None = None, tax_id: str | None = None, contact_person: str | None = None, email: str | None = None, phone: str | None = None, address: str | None = None, notes: str | None = None) -> dict:
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise NotFoundError("Supplier", supplier_id)
    if tax_id:
        existing = await db.execute(select(Supplier).where(Supplier.tax_id == tax_id, Supplier.id != supplier_id))
        if existing.scalar_one_or_none():
            raise ConflictError(f"Tax ID '{tax_id}' already exists")
    updates = {k: v for k, v in {"name": name, "tax_id": tax_id, "contact_person": contact_person, "email": email, "phone": phone, "address": address, "notes": notes}.items() if v is not None}
    if updates:
        from sqlalchemy import update
        await db.execute(update(Supplier).where(Supplier.id == supplier_id).values(**updates))
        await db.commit()
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one()
    return {"id": str(supplier.id), "name": supplier.name, "tax_id": supplier.tax_id, "contact_person": supplier.contact_person, "email": supplier.email, "phone": supplier.phone, "address": supplier.address, "notes": supplier.notes, "created_at": supplier.created_at.isoformat(), "updated_at": supplier.updated_at.isoformat()}


async def delete_supplier(db: AsyncSession, supplier_id: uuid.UUID) -> dict:
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise NotFoundError("Supplier", supplier_id)
    await db.delete(supplier)
    await db.commit()
    return {"message": f"Supplier '{supplier.name}' deleted"}


async def list_suppliers(db: AsyncSession, page: int = 1, page_size: int = 20, search: str | None = None) -> dict:
    base_query = select(Supplier)
    if search:
        like = f"%{search}%"
        base_query = base_query.where((Supplier.name.ilike(like)) | (Supplier.tax_id.ilike(like)) | (Supplier.email.ilike(like)))
    total_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = total_result.scalar()
    items_query = base_query.order_by(Supplier.name).offset((page - 1) * page_size).limit(page_size)
    items_result = await db.execute(items_query)
    suppliers = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {"items": [{"id": str(s.id), "name": s.name, "tax_id": s.tax_id, "contact_person": s.contact_person, "email": s.email, "phone": s.phone, "address": s.address, "notes": s.notes, "created_at": s.created_at.isoformat(), "updated_at": s.updated_at.isoformat()} for s in suppliers], "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}
