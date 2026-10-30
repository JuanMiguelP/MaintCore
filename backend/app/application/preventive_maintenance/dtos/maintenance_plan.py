"""DTOs del dominio de Preventive Maintenance."""

from uuid import UUID
from datetime import date
from pydantic import BaseModel, Field


class MaintenancePlanCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    asset_id: str = Field(..., description="UUID del activo")
    frequency_type: str = Field(..., pattern="^(DAILY|WEEKLY|MONTHLY|QUARTERLY|YEARLY)$")
    frequency_value: int = Field(..., ge=1, le=365, default=1)
    estimated_hours: float | None = None
    priority: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")


class MaintenancePlanUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    asset_id: str | None = None
    frequency_type: str | None = Field(None, pattern="^(DAILY|WEEKLY|MONTHLY|QUARTERLY|YEARLY)$")
    frequency_value: int | None = Field(None, ge=1, le=365)
    estimated_hours: float | None = None
    priority: str | None = Field(None, pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    is_active: bool | None = None


class MaintenancePlanResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str | None
    asset_name: str | None
    frequency_type: str
    frequency_value: int
    estimated_hours: float | None
    priority: str
    is_active: bool
    last_generated_at: str | None
    next_due_date: str | None
    created_by: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class MaintenancePlanListResponse(BaseModel):
    items: list[MaintenancePlanResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class GenerateFromPlanRequest(BaseModel):
    """Solicitud para generar manualmente una ejecución desde un plan."""
    scheduled_date: date = Field(..., description="Fecha programada")
