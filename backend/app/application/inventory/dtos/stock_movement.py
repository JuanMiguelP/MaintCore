"""DTOs del dominio de StockMovements."""

from uuid import UUID
from pydantic import BaseModel, Field


class StockMovementCreateRequest(BaseModel):
    part_id: str = Field(..., description="UUID de la pieza")
    movement_type: str = Field(..., pattern="^(IN|OUT|ADJUSTMENT)$", description="TIPO: IN, OUT o ADJUSTMENT")
    quantity: int = Field(..., gt=0, description="Cantidad (positiva)")
    reason: str | None = Field(None, max_length=500, description="Motivo del movimiento")


class StockMovementResponse(BaseModel):
    id: str
    part_number: str
    part_name: str
    movement_type: str
    quantity: int
    reason: str | None
    performed_by: str | None
    performed_at: str

    model_config = {"from_attributes": True}


class StockMovementListResponse(BaseModel):
    items: list[StockMovementResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
