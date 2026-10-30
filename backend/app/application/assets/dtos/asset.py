"""DTOs del dominio de Assets."""

from uuid import UUID
from datetime import date
from pydantic import BaseModel, Field


class AssetCreateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category_id: UUID
    location_id: UUID | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial_number: str | None = None
    purchase_date: date | None = None
    status: str = Field(default="ACTIVE", pattern="^(ACTIVE|INACTIVE|MAINTENANCE|RETIRED)$")
    notes: str | None = None


class AssetUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    category_id: UUID | None = None
    location_id: UUID | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial_number: str | None = None
    purchase_date: date | None = None
    status: str | None = Field(None, pattern="^(ACTIVE|INACTIVE|MAINTENANCE|RETIRED)$")
    notes: str | None = None


class AssetResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str | None
    category_name: str | None
    location_name: str | None
    manufacturer: str | None
    model: str | None
    serial_number: str | None
    purchase_date: str | None
    status: str
    notes: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class AssetListResponse(BaseModel):
    items: list[AssetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
