"""Seed data para reglas de notificación por defecto."""

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.notifications.notification_rule import NotificationRule


async def seed_notification_rules(db: AsyncSession) -> list[NotificationRule]:
    """Crea reglas de notificación por defecto si no existen."""
    default_rules = [
        {
            "name": "Low Stock Alert",
            "event_type": "LOW_STOCK",
            "enabled": True,
            "recipients": ["compras@empresa.com", "almacen@empresa.com"],
            "frequency": "ON_CHANGE",
        },
        {
            "name": "Out of Stock Critical",
            "event_type": "OUT_OF_STOCK",
            "enabled": True,
            "recipients": ["compras@empresa.com", "mantenimiento@empresa.com"],
            "frequency": "ON_CHANGE",
        },
        {
            "name": "Work Order Assigned",
            "event_type": "WORK_ORDER_ASSIGNED",
            "enabled": True,
            "recipients": ["mantenimiento@empresa.com"],
            "frequency": "ON_CHANGE",
        },
        {
            "name": "Work Order Completed",
            "event_type": "WORK_ORDER_COMPLETED",
            "enabled": True,
            "recipients": ["mantenimiento@empresa.com"],
            "frequency": "ON_CHANGE",
        },
        {
            "name": "Preventive Overdue",
            "event_type": "PREVENTIVE_OVERDUE",
            "enabled": True,
            "recipients": ["mantenimiento@empresa.com"],
            "frequency": "DAILY_SUMMARY",
        },
    ]

    created_rules = []
    for rule_data in default_rules:
        # Verificar si ya existe
        existing = await db.execute(
            select(NotificationRule).where(
                (NotificationRule.event_type == rule_data["event_type"])
            )
        )
        if not existing.scalar_one_or_none():
            rule = NotificationRule(**rule_data)
            db.add(rule)
            created_rules.append(rule)

    if created_rules:
        await db.commit()

    return created_rules
