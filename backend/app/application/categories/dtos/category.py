"""DTOs del dominio de Categories."""

from uuid import UUID
from pydantic import BaseModel, Field


class CategoryCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class CategoryUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    description: str | None
    created_at: str

    model_config = {"from_attributes": True}


class CategoryListResponse(BaseModel):
    items: list[CategoryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
