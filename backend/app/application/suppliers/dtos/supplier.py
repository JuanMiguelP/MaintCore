"""DTOs del dominio de Suppliers."""

from uuid import UUID
from pydantic import BaseModel, Field


class SupplierCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    tax_id: str | None = Field(None, max_length=50)
    contact_person: str | None = Field(None, max_length=200)
    email: str | None = None
    phone: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)
    notes: str | None = Field(None, max_length=1000)


class SupplierUpdateRequest(BaseModel):
    name: str | None = None
    tax_id: str | None = None
    contact_person: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None


class SupplierResponse(BaseModel):
    id: str
    name: str
    tax_id: str | None
    contact_person: str | None
    email: str | None
    phone: str | None
    address: str | None
    notes: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class SupplierListResponse(BaseModel):
    items: list[SupplierResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
