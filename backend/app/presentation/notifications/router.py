"""Router de Notificaciones — capa de presentación."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.notifications.use_cases.notification_rule_use_cases import (
    create_notification_rule,
    get_notification_rule,
    list_notification_rules,
    update_notification_rule,
    delete_notification_rule,
)
from app.application.notifications.dtos.notification_rule import (
    NotificationRuleCreateRequest,
    NotificationRuleUpdateRequest,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.shared.exceptions import NotFoundError

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new(
    body: NotificationRuleCreateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await create_notification_rule(
            db,
            name=body.name,
            event_type=body.event_type,
            recipients=body.recipients,
            enabled=body.enabled,
            frequency=body.frequency,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def get_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    event_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    return await list_notification_rules(db, page=page, page_size=page_size, event_type=event_type)


@router.get("/{rule_id}")
async def get_by_id(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await get_notification_rule(db, UUID(rule_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{rule_id}")
async def update_by_id(
    rule_id: str,
    body: NotificationRuleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        return await update_notification_rule(
            db, UUID(rule_id),
            name=body.name,
            event_type=body.event_type,
            enabled=body.enabled,
            recipients=body.recipients,
            frequency=body.frequency,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_by_id(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user = Depends(get_current_user),
):
    try:
        await delete_notification_rule(db, UUID(rule_id))
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
