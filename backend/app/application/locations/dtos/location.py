"""DTOs del dominio de Locations."""

from uuid import UUID
from pydantic import BaseModel, Field


class LocationCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str | None = Field(None, max_length=20)
    parent_id: UUID | None = None
    address: str | None = None


class LocationUpdateRequest(BaseModel):
    name: str | None = None
    code: str | None = None
    parent_id: UUID | None = None
    address: str | None = None
    is_active: bool | None = None


class LocationResponse(BaseModel):
    id: str
    name: str
    code: str | None
    parent_id: UUID | None
    address: str | None
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class LocationListResponse(BaseModel):
    items: list[LocationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
