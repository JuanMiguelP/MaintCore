"""Servicio de notificaciones con protección anti-spam."""

import uuid
from datetime import datetime, date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.notifications.notification_rule import NotificationRule
from app.domain.notifications.part_alert_state import PartAlertState
from app.domain.inventory.part import Part
from app.infrastructure.notifications.email_service import EmailService

# Templates de emails
EMAIL_TEMPLATES = {
    "LOW_STOCK": {
        "subject": "[MaintCore] Stock mínimo alcanzado",
        "html": """
        <h2>Stock mínimo alcanzado</h2>
        <p><strong>Repuesto:</strong> {part_name}</p>
        <p><strong>Código:</strong> {part_number}</p>
        <p><strong>Stock actual:</strong> {current_stock}</p>
        <p><strong>Stock mínimo:</strong> {minimum_stock}</p>
        <p><strong>Proveedor:</strong> {supplier_name or 'N/A'}</p>
        <p><strong>Fecha:</strong> {date}</p>
        <p><a href="{system_url}">Ver en el sistema</a></p>
        """,
    },
    "OUT_OF_STOCK": {
        "subject": "[MaintCore] STOCK AGOTADO",
        "html": """
        <h2 style="color: red;">STOCK AGOTADO — Acción inmediata requerida</h2>
        <p><strong>Repuesto:</strong> {part_name}</p>
        <p><strong>Código:</strong> {part_number}</p>
        <p><strong>Proveedor:</strong> {supplier_name or 'N/A'}</p>
        <p><strong>Último stock disponible:</strong> {last_known_stock}</p>
        <p><strong>Fecha:</strong> {date}</p>
        <p><strong>Impacto potencial:</strong> Parada de mantenimiento no planificada</p>
        <p><a href="{system_url}">Ver en el sistema</a></p>
        """,
    },
    "STOCK_RECOVERED": {
        "subject": "[MaintCore] Stock recuperado",
        "html": """
        <h2 style="color: green;">Stock recuperado</h2>
        <p><strong>Repuesto:</strong> {part_name}</p>
        <p><strong>Código:</strong> {part_number}</p>
        <p><strong>Stock actual:</strong> {current_stock}</p>
        <p><strong>Stock mínimo:</strong> {minimum_stock}</p>
        <p><strong>Fecha de recuperación:</strong> {date}</p>
        <p><a href="{system_url}">Ver en el sistema</a></p>
        """,
    },
}


class NotificationService:
    """Gestiona notificaciones con protección anti-spam."""

    def __init__(self):
        self.email_service = EmailService()

    async def check_and_notify_low_stock(
        self,
        db: AsyncSession,
        part: Part,
    ) -> bool:
        """Evalúa y envía alerta de stock bajo con anti-spam."""
        r = await db.execute(
            select(PartAlertState).where(PartAlertState.part_id == part.id)
        )
        alert_state = r.scalar_one_or_none()

        if not alert_state:
            alert_state = PartAlertState(part_id=part.id)
            db.add(alert_state)

        is_low = part.current_stock <= part.minimum_stock
        is_out = part.current_stock == 0

        # Determinar si hay cambio de estado
        state_changed = False
        event_type = None

        if is_out and not alert_state.is_out_of_stock:
            event_type = "OUT_OF_STOCK"
            state_changed = True
        elif is_low and not alert_state.is_low_stock:
            event_type = "LOW_STOCK"
            state_changed = True
        elif not is_low and alert_state.is_low_stock:
            event_type = "STOCK_RECOVERED"
            state_changed = True

        # Actualizar estado
        alert_state.is_low_stock = is_low
        alert_state.is_out_of_stock = is_out
        alert_state.updated_at = datetime.utcnow()

        if state_changed and event_type:
            alert_state.last_notification_sent = datetime.utcnow()
            await db.commit()
            await db.refresh(alert_state)
            return await self._send_notification(part, event_type, db)

        return False

    async def _send_notification(
        self,
        part: Part,
        event_type: str,
        db: AsyncSession,
    ) -> bool:
        """Envía notificación por email."""
        try:
            r = await db.execute(
                select(NotificationRule).where(
                    (NotificationRule.event_type == event_type) &
                    (NotificationRule.enabled == True)
                )
            )
            rule = r.scalar_one_or_none()

            if not rule or not rule.recipients:
                return False

            template = EMAIL_TEMPLATES.get(event_type)
            if not template:
                return False

            supplier_name = None
            if part.supplier_id:
                from app.domain.inventory.supplier import Supplier
                r2 = await db.execute(
                    select(Supplier.name).where(Supplier.id == part.supplier_id)
                )
                supplier_name = r2.scalar_one_or_none()

            html = template["html"].format(
                part_name=part.name,
                part_number=part.part_number,
                current_stock=part.current_stock,
                minimum_stock=part.minimum_stock,
                supplier_name=supplier_name,
                date=date.today().isoformat(),
                last_known_stock=1,
                system_url="http://localhost:5173",
            )

            return self.email_service.send_email(
                to_emails=rule.recipients,
                subject=template["subject"],
                html_content=html,
            )

        except Exception as e:
            import logging
            logging.error(f"Failed to send notification: {e}")
            return False

    async def send_work_order_assigned(
        self, db: AsyncSession, wo, tech
    ) -> bool:
        """Envía email al técnico cuando se le asigna una OT."""
        try:
            r = await db.execute(
                select(NotificationRule).where(
                    (NotificationRule.event_type == "WORK_ORDER_ASSIGNED") &
                    (NotificationRule.enabled == True)
                )
            )
            rule = r.scalar_one_or_none()
            if not rule or not rule.recipients:
                return False

            r2 = await db.execute(select(User.email).where(User.id == tech.id))
            technician_email = r2.scalar_one_or_none()
            if not technician_email:
                return False

            subject = f"[MaintCore] Nueva OT Asignada: {wo.wo_number}"
            html = f"""
            <h2>Orden de Trabajo Asignada</h2>
            <p><strong>WO Number:</strong> {wo.wo_number}</p>
            <p><strong>Título:</strong> {wo.title}</p>
            <p><strong>Activo:</strong> {wo.asset_name or 'N/A'}</p>
            <p><strong>Prioridad:</strong> {wo.priority}</p>
            <p><strong>Fecha Programada:</strong> {wo.scheduled_date.isoformat() if wo.scheduled_date else 'No definida'}</p>
            """

            return self.email_service.send_email(
                to_emails=[technician_email],
                subject=subject,
                html_content=html,
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to send work order assigned notification: {e}")
            return False

    async def send_work_order_status_changed(
        self, db: AsyncSession, wo, new_status: str
    ) -> bool:
        """Envía email al solicitante cuando una OT se completa o cancela."""
        try:
            event_type = "WORK_ORDER_COMPLETED" if new_status == "COMPLETED" else "WORK_ORDER_CANCELLED"
            r = await db.execute(
                select(NotificationRule).where(
                    (NotificationRule.event_type == event_type) &
                    (NotificationRule.enabled == True)
                )
            )
            rule = r.scalar_one_or_none()
            if not rule or not rule.recipients:
                return False

            r2 = await db.execute(select(User.email).where(User.id == wo.requested_by))
            requester_email = r2.scalar_one_or_none()
            if not requester_email:
                return False

            subject = f"[MaintCore] OT {new_status}: {wo.wo_number}"
            html = f"""
            <h2>Orden de Trabajo {new_status}</h2>
            <p><strong>WO Number:</strong> {wo.wo_number}</p>
            <p><strong>Título:</strong> {wo.title}</p>
            <p><strong>Activo:</strong> {wo.asset_name or 'N/A'}</p>
            <p><strong>Prioridad:</strong> {wo.priority}</p>
            """

            return self.email_service.send_email(
                to_emails=[requester_email],
                subject=subject,
                html_content=html,
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to send work order status changed notification: {e}")
            return False
