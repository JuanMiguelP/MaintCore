"""Audit middleware — registra autom\u00e1ticamente todas las acciones."""

import json
from datetime import datetime, timezone
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response as StarletteResponse

from app.database import async_session_factory
from app.domain.audit.audit_log import AuditLog


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware que registra autom\u00e0ticamente las acciones en audit_logs.

    Registra: usuario, acci\u00f3n, entidad, entity_id, timestamp, ip_address, changes.
    Usa JSONB para el campo changes.
    """

    # Rutas que NO se registran (evitar ruido)
    EXCLUDED_PATHS = {"/api/health", "/api/docs", "/api/redoc", "/openapi.json", "/favicon.ico"}

    # Mapeo m\u00e9todo HTTP \u2192 acci\u00f3n
    ACTION_MAP = {
        "POST": "CREATE",
        "PUT": "UPDATE",
        "PATCH": "UPDATE",
        "DELETE": "DELETE",
        "GET": "READ",
    }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> StarletteResponse:
        """Procesa la request y registra la acci\u00f3n despu\u00e9s."""
        # Excluir rutas de documentaci\u00f3n y health
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Extraer informaci\u00f3n b\u00e1sica
        method = request.method
        path = request.url.path
        action = self.ACTION_MAP.get(method, "OTHER")
        ip_address = self._get_client_ip(request)

        # Determinar entidad desde la ruta
        entity_type = self._extract_entity(path)
        entity_id = self._extract_entity_id(path)

        # Extraer user_id del request state (set by get_current_user)
        user_id = getattr(request.state, "user_id", None)

        # Procesar la request
        response = await call_next(request)

        # Solo registrar acciones que modifican datos o tienen error
        if method in ("POST", "PUT", "PATCH", "DELETE") or response.status_code >= 400:
            await self._log_action(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else None,
                ip_address=ip_address,
                path=path,
                method=method,
                status_code=response.status_code,
            )

        return response

    async def _log_action(
        self,
        user_id: str | None,
        action: str,
        entity_type: str,
        entity_id: str | None,
        ip_address: str | None,
        path: str,
        method: str,
        status_code: int,
    ) -> None:
        """Escribe el registro de auditor\u00eda en la base de datos."""
        try:
            async with async_session_factory() as session:
                log_entry = AuditLog(
                    user_id=user_id,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    ip_address=ip_address,
                    description=f"{method} {path} -> {status_code}",
                )
                session.add(log_entry)
                await session.commit()
        except Exception:
            # No romper la request si falla el logging
            pass

    @staticmethod
    def _get_client_ip(request: Request) -> str | None:
        """Extrae la IP real del cliente (considerando proxy)."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        client = request.client
        return client.host if client else None

    @staticmethod
    def _extract_entity(path: str) -> str:
        """Extrae el tipo de entidad desde la ruta."""
        parts = path.strip("/").split("/")
        # /api/v1/assets/{id} -> assets
        # /api/v1/categories -> categories
        if len(parts) >= 2:
            return parts[2].title().replace("s", "") if parts[2] else "UNKNOWN"
        return "UNKNOWN"

    @staticmethod
    def _extract_entity_id(path: str):
        """Extrae el entity_id desde la ruta."""
        parts = path.strip("/").split("/")
        # /api/v1/assets/{id} -> id
        if len(parts) >= 3:
            return parts[3]
        return None
