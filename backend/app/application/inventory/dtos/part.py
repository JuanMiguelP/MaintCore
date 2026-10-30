"""DTOs del dominio de Parts."""

from uuid import UUID
from pydantic import BaseModel, Field


class PartCreateRequest(BaseModel):
    part_number: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    manufacturer: str | None = None
    supplier_id: str | None = None
    unit_cost: float = Field(default=0.0, ge=0)
    minimum_stock: int = Field(default=0, ge=0)
    current_stock: int = Field(default=0, ge=0)
    location: str | None = None
    notes: str | None = None


class PartUpdateRequest(BaseModel):
    part_number: str | None = None
    name: str | None = None
    description: str | None = None
    manufacturer: str | None = None
    supplier_id: str | None = None
    unit_cost: float | None = Field(None, ge=0)
    minimum_stock: int | None = Field(None, ge=0)
    current_stock: int | None = Field(None, ge=0)
    location: str | None = None
    notes: str | None = None


class PartResponse(BaseModel):
    id: str
    part_number: str
    name: str
    description: str | None
    manufacturer: str | None
    supplier_name: str | None
    unit_cost: float
    minimum_stock: int
    current_stock: int
    location: str | None
    notes: str | None
    is_low_stock: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class PartListResponse(BaseModel):
    items: list[PartResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
