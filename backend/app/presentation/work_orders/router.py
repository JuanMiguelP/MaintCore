"""Router de WorkOrders — capa de presentaciÃ³n."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.work_orders.use_cases.work_order_use_cases import (
    create_work_order,
    get_work_order,
    list_work_orders,
    update_work_order,
    delete_work_order,
    change_status,
    assign_technician,
    add_part,
    remove_part,
    get_status_history,
    get_parts,
)
from app.application.work_orders.dtos.work_order import (
    WorkOrderCreateRequest,
    WorkOrderUpdateRequest,
    ChangeStatusRequest,
    AssignTechnicianRequest,
    AddPartRequest,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError, ValidationError, ConflictError

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])


# ─── CREATE ───────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new(
    body: WorkOrderCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        requested_by = getattr(current_user, "id", None)
        return await create_work_order(
            db,
            title=body.title,
            description=body.description,
            asset_id=UUID(body.asset_id) if body.asset_id else None,
            priority=body.priority,
            assigned_to=UUID(body.assigned_to) if body.assigned_to else None,
            scheduled_date=body.scheduled_date,
            estimated_hours=body.estimated_hours,
            notes=body.notes,
            requested_by=requested_by,
        )
    except (NotFoundError, ValidationError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── LIST ─────────────────────────────────────────────────

@router.get("")
async def get_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    asset_id: str | None = Query(None),
    assigned_to: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    a_id = UUID(asset_id) if asset_id else None
    at_id = UUID(assigned_to) if assigned_to else None
    return await list_work_orders(
        db, page=page, page_size=page_size, search=search,
        status=status, priority=priority,
        asset_id=a_id, assigned_to=at_id,
    )


# ─── GET ──────────────────────────────────────────────────

@router.get("/{wo_id}")
async def get_by_id(
    wo_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await get_work_order(db, UUID(wo_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── UPDATE ───────────────────────────────────────────────

@router.put("/{wo_id}")
async def update_by_id(
    wo_id: str,
    body: WorkOrderUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        scheduled_date = body.scheduled_date
        if isinstance(scheduled_date, str):
            from datetime import date
            scheduled_date = date.fromisoformat(scheduled_date)
        return await update_work_order(
            db, UUID(wo_id),
            title=body.title,
            description=body.description,
            asset_id=UUID(body.asset_id) if body.asset_id else None,
            priority=body.priority,
            assigned_to=UUID(body.assigned_to) if body.assigned_to else None,
            scheduled_date=scheduled_date,
            estimated_hours=body.estimated_hours,
            notes=body.notes,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── DELETE ───────────────────────────────────────────────

@router.delete("/{wo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_by_id(
    wo_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        await delete_work_order(db, UUID(wo_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── CHANGE STATUS ────────────────────────────────────────

@router.post("/{wo_id}/status")
async def change_status_endpoint(
    wo_id: str,
    body: ChangeStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        changed_by = getattr(current_user, "id", None)
        result = await change_status(
            db, UUID(wo_id),
            new_status=body.new_status,
            changed_by=changed_by,
        )
        
        # Sincronizar con Preventive Maintenance si es COMPLETED o CANCELLED
        if body.new_status in ("COMPLETED", "CANCELLED"):
            from app.application.preventive_maintenance.use_cases.maintenance_plan_use_cases import update_execution_status_from_wo
            pm_result = await update_execution_status_from_wo(db, UUID(wo_id), body.new_status)
            if pm_result:
                result["preventive_execution_updated"] = True
        
        return result
    except (NotFoundError, ValidationError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── ASSIGN TECHNICIAN ────────────────────────────────────

@router.post("/{wo_id}/assign")
async def assign_technician_endpoint(
    wo_id: str,
    body: AssignTechnicianRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        assigned_by = getattr(current_user, "id", None)
        return await assign_technician(
            db, UUID(wo_id),
            technician_id=UUID(body.technician_id),
            assigned_by=assigned_by,
        )
    except (NotFoundError, ValidationError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── ADD PART ─────────────────────────────────────────────

@router.post("/{wo_id}/parts", status_code=status.HTTP_201_CREATED)
async def add_part_endpoint(
    wo_id: str,
    body: AddPartRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        added_by = getattr(current_user, "id", None)
        return await add_part(
            db, UUID(wo_id),
            part_id=UUID(body.part_id),
            quantity=body.quantity,
            added_by=added_by,
        )
    except (NotFoundError, ValidationError, ConflictError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── REMOVE PART ──────────────────────────────────────────

@router.delete("/{wo_id}/parts/{wo_part_id}")
async def remove_part_endpoint(
    wo_id: str,
    wo_part_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        removed_by = getattr(current_user, "id", None)
        return await remove_part(
            db, UUID(wo_id),
            wo_part_id=UUID(wo_part_id),
            removed_by=removed_by,
        )
    except (NotFoundError, ValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── GET STATUS HISTORY ───────────────────────────────────

@router.get("/{wo_id}/status-history")
async def get_status_history_endpoint(
    wo_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await get_status_history(db, UUID(wo_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ─── GET PARTS ────────────────────────────────────────────

@router.get("/{wo_id}/parts")
async def get_parts_endpoint(
    wo_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await get_parts(db, UUID(wo_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

