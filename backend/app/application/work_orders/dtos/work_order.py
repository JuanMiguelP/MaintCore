"""DTOs del dominio de WorkOrders."""

from uuid import UUID
from datetime import date
from pydantic import BaseModel, Field


class WorkOrderCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    asset_id: str | None = None
    priority: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    assigned_to: str | None = None
    scheduled_date: date | None = None
    estimated_hours: float | None = None
    notes: str | None = None


class WorkOrderUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    asset_id: str | None = None
    priority: str | None = Field(None, pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    assigned_to: str | None = None
    scheduled_date: date | None = None
    estimated_hours: float | None = None
    notes: str | None = None


class AssignTechnicianRequest(BaseModel):
    technician_id: str = Field(..., description="UUID del técnico asignado")


class ChangeStatusRequest(BaseModel):
    new_status: str = Field(..., pattern="^(OPEN|ASSIGNED|IN_PROGRESS|ON_HOLD|COMPLETED|CANCELLED)$")


class AddPartRequest(BaseModel):
    part_id: str = Field(...)
    quantity: int = Field(..., gt=0)


class WorkOrderResponse(BaseModel):
    id: str
    wo_number: str
    title: str
    description: str | None
    asset_name: str | None
    priority: str
    status: str
    technician_name: str | None
    requester_name: str | None
    estimated_hours: float | None
    actual_hours: float
    scheduled_date: str | None
    start_date: str | None
    completed_date: str | None
    notes: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class WorkOrderListResponse(BaseModel):
    items: list[WorkOrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
