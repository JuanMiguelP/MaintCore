"""DTOs del dominio de Notificaciones."""

from uuid import UUID
from pydantic import BaseModel, Field


class NotificationRuleCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    event_type: str = Field(..., pattern="^(LOW_STOCK|OUT_OF_STOCK|WORK_ORDER_ASSIGNED|WORK_ORDER_COMPLETED|WORK_ORDER_CANCELLED|PREVENTIVE_OVERDUE|CRITICAL_WORK_ORDER)$")
    enabled: bool = True
    recipients: list[str] = Field(..., min_length=1)
    frequency: str = Field(default="ON_CHANGE", pattern="^(ON_CHANGE|DAILY_SUMMARY)$")


class NotificationRuleUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    event_type: str | None = Field(None, pattern="^(LOW_STOCK|OUT_OF_STOCK|WORK_ORDER_ASSIGNED|WORK_ORDER_COMPLETED|WORK_ORDER_CANCELLED|PREVENTIVE_OVERDUE|CRITICAL_WORK_ORDER)$")
    enabled: bool | None = None
    recipients: list[str] | None = None
    frequency: str | None = Field(None, pattern="^(ON_CHANGE|DAILY_SUMMARY)$")


class NotificationRuleResponse(BaseModel):
    id: str
    name: str
    event_type: str
    enabled: bool
    recipients: list[str]
    frequency: str

    model_config = {"from_attributes": True}


class NotificationRuleListResponse(BaseModel):
    items: list[NotificationRuleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
