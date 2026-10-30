"""Router de Preventive Maintenance — capa de presentaciÃ³n."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.preventive_maintenance.use_cases.maintenance_plan_use_cases import (
    create_maintenance_plan,
    get_maintenance_plan,
    list_maintenance_plans,
    update_maintenance_plan,
    delete_maintenance_plan,
    generate_from_plan,
    auto_generate_overdue,
    get_overdue_plans,
    get_upcoming_plans,
)
from app.application.preventive_maintenance.dtos.maintenance_plan import (
    MaintenancePlanCreateRequest,
    MaintenancePlanUpdateRequest,
    GenerateFromPlanRequest,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError, ConflictError

router = APIRouter(prefix="/preventive-maintenance", tags=["Preventive Maintenance"])


# ─── CREATE ───────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new(
    body: MaintenancePlanCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        created_by = getattr(current_user, "id", None)
        return await create_maintenance_plan(
            db,
            name=body.name,
            asset_id=UUID(body.asset_id),
            frequency_type=body.frequency_type,
            frequency_value=body.frequency_value,
            description=body.description,
            estimated_hours=body.estimated_hours,
            priority=body.priority,
            created_by=created_by,
        )
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── LIST ─────────────────────────────────────────────────

@router.get("")
async def get_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    asset_id: str | None = Query(None),
    is_active: bool | None = Query(None),
    frequency_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    a_id = UUID(asset_id) if asset_id else None
    return await list_maintenance_plans(
        db, page=page, page_size=page_size, search=search,
        asset_id=a_id, is_active=is_active, frequency_type=frequency_type,
    )


# ─── GET ──────────────────────────────────────────────────

@router.get("/{plan_id}")
async def get_by_id(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await get_maintenance_plan(db, UUID(plan_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── UPDATE ───────────────────────────────────────────────

@router.put("/{plan_id}")
async def update_by_id(
    plan_id: str,
    body: MaintenancePlanUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await update_maintenance_plan(
            db, UUID(plan_id),
            name=body.name,
            description=body.description,
            asset_id=UUID(body.asset_id) if body.asset_id else None,
            frequency_type=body.frequency_type,
            frequency_value=body.frequency_value,
            estimated_hours=body.estimated_hours,
            priority=body.priority,
            is_active=body.is_active,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── DELETE ───────────────────────────────────────────────

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_by_id(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        await delete_maintenance_plan(db, UUID(plan_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── GENERATE FROM PLAN ───────────────────────────────────

@router.post("/{plan_id}/generate", status_code=status.HTTP_201_CREATED)
async def generate_endpoint(
    plan_id: str,
    body: GenerateFromPlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        generated_by = getattr(current_user, "id", None)
        return await generate_from_plan(
            db, UUID(plan_id),
            scheduled_date=body.scheduled_date,
            generated_by=generated_by,
        )
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── AUTO GENERATE OVERDUE ────────────────────────────────

@router.post("/auto-generate-overdue", status_code=status.HTTP_201_CREATED)
async def auto_generate_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        generated_by = getattr(current_user, "id", None)
        return await auto_generate_overdue(db, generated_by=generated_by)
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── GET OVERDUE PLANS ────────────────────────────────────

@router.get("/overdue")
async def get_overdue_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    return await get_overdue_plans(db, page=page, page_size=page_size)


# ─── GET UPCOMING PLANS ───────────────────────────────────

@router.get("/upcoming")
async def get_upcoming_endpoint(
    days_ahead: int = Query(30, ge=1, le=365),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    return await get_upcoming_plans(db, days_ahead=days_ahead, page=page, page_size=page_size)

