"""Use Cases del dominio de Notificaciones."""

import uuid
from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.notifications.notification_rule import NotificationRule
from app.shared.exceptions import NotFoundError

# ─── CREATE ───────────────────────────────────────────────

async def create_notification_rule(
    db: AsyncSession,
    name: str,
    event_type: str,
    recipients: list[str],
    enabled: bool = True,
    frequency: str = "ON_CHANGE",
) -> dict:
    """Crea una regla de notificación."""
    rule = NotificationRule(
        name=name,
        event_type=event_type,
        enabled=enabled,
        recipients=recipients,
        frequency=frequency,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    return {
        "id": str(rule.id),
        "name": rule.name,
        "event_type": rule.event_type,
        "enabled": rule.enabled,
        "recipients": rule.recipients,
        "frequency": rule.frequency,
    }


# ─── LIST ─────────────────────────────────────────────────

async def list_notification_rules(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    event_type: str | None = None,
) -> dict:
    """Lista de reglas de notificación."""
    base_query = select(NotificationRule)
    if event_type:
        base_query = base_query.where(NotificationRule.event_type == event_type)

    count_q = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar()

    items_q = (
        base_query
        .order_by(NotificationRule.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items_result = await db.execute(items_q)
    rules = items_result.scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": [
            {
                "id": str(r.id),
                "name": r.name,
                "event_type": r.event_type,
                "enabled": r.enabled,
                "recipients": r.recipients,
                "frequency": r.frequency,
            }
            for r in rules
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# ─── GET ──────────────────────────────────────────────────

async def get_notification_rule(db: AsyncSession, rule_id: uuid.UUID) -> dict:
    """Obtiene una regla de notificación."""
    r = await db.execute(select(NotificationRule).where(NotificationRule.id == rule_id))
    rule = r.scalar_one_or_none()
    if not rule:
        raise NotFoundError("NotificationRule", rule_id)

    return {
        "id": str(rule.id),
        "name": rule.name,
        "event_type": rule.event_type,
        "enabled": rule.enabled,
        "recipients": rule.recipients,
        "frequency": rule.frequency,
    }


# ─── UPDATE ───────────────────────────────────────────────

async def update_notification_rule(
    db: AsyncSession,
    rule_id: uuid.UUID,
    name: str | None = None,
    event_type: str | None = None,
    enabled: bool | None = None,
    recipients: list[str] | None = None,
    frequency: str | None = None,
) -> dict:
    """Actualiza una regla de notificación."""
    r = await db.execute(select(NotificationRule).where(NotificationRule.id == rule_id))
    rule = r.scalar_one_or_none()
    if not rule:
        raise NotFoundError("NotificationRule", rule_id)

    if name is not None:
        rule.name = name
    if event_type is not None:
        rule.event_type = event_type
    if enabled is not None:
        rule.enabled = enabled
    if recipients is not None:
        rule.recipients = recipients
    if frequency is not None:
        rule.frequency = frequency

    await db.commit()
    await db.refresh(rule)

    return {
        "id": str(rule.id),
        "name": rule.name,
        "event_type": rule.event_type,
        "enabled": rule.enabled,
        "recipients": rule.recipients,
        "frequency": rule.frequency,
    }


# ─── DELETE ───────────────────────────────────────────────

async def delete_notification_rule(db: AsyncSession, rule_id: uuid.UUID) -> dict:
    """Elimina una regla de notificación."""
    r = await db.execute(select(NotificationRule).where(NotificationRule.id == rule_id))
    rule = r.scalar_one_or_none()
    if not rule:
        raise NotFoundError("NotificationRule", rule_id)

    await db.delete(rule)
    await db.commit()

    return {"message": f"NotificationRule {rule.name} deleted"}
