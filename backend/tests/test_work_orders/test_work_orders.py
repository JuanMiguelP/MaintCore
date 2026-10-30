"""Tests de integraciÃ³n para Work Orders."""

import pytest


async def test_create_work_order_requires_auth(client):
    """Crear work order sin autenticaciÃ³n retorna 401."""
    response = await client.post("/api/v1/work-orders", json={
        "title": "Test Work Order",
        "priority": "HIGH",
    })
    assert response.status_code == 401


async def test_list_work_orders_requires_auth(client):
    """Listar work orders sin autenticaciÃ³n retorna 401."""
    response = await client.get("/api/v1/work-orders")
    assert response.status_code == 401


async def test_get_work_order_requires_auth(client):
    """Obtener work order sin autenticaciÃ³n retorna 401."""
    response = await client.get("/api/v1/work-orders/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


async def test_update_work_order_requires_auth(client):
    """Actualizar work order sin autenticaciÃ³n retorna 401."""
    response = await client.put("/api/v1/work-orders/00000000-0000-0000-0000-000000000000", json={
        "title": "Updated Title",
    })
    assert response.status_code == 401


async def test_delete_work_order_requires_auth(client):
    """Eliminar work order sin autenticaciÃ³n retorna 401."""
    response = await client.delete("/api/v1/work-orders/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


async def test_change_status_requires_auth(client):
    """Cambiar estado sin autenticaciÃ³n retorna 401."""
    response = await client.post("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/status", json={
        "new_status": "ASSIGNED",
    })
    assert response.status_code == 401


async def test_assign_technician_requires_auth(client):
    """Asignar tÃ©cnico sin autenticaciÃ³n retorna 401."""
    response = await client.post("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/assign", json={
        "technician_id": "00000000-0000-0000-0000-000000000000",
    })
    assert response.status_code == 401


async def test_add_part_requires_auth(client):
    """Agregar repuesto sin autenticaciÃ³n retorna 401."""
    response = await client.post("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/parts", json={
        "part_id": "00000000-0000-0000-0000-000000000000",
        "quantity": 1,
    })
    assert response.status_code == 401


async def test_get_status_history_requires_auth(client):
    """Obtener historial sin autenticaciÃ³n retorna 401."""
    response = await client.get("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/status-history")
    assert response.status_code == 401


async def test_get_parts_requires_auth(client):
    """Obtener repuestos sin autenticaciÃ³n retorna 401."""
    response = await client.get("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/parts")
    assert response.status_code == 401


# ─── P0 FIX TESTS ────────────────────────────────────────

async def test_create_work_order_validates_priority_pattern(client):
    """P1-01: El DTO valida el patrÃ³n de priority."""
    response = await client.post("/api/v1/work-orders", json={
        "title": "Test WO",
        "priority": "INVALID_PRIORITY",  # Fuera del patrÃ³n
    })
    assert response.status_code == 422


async def test_create_work_order_validates_required_fields(client):
    """P1-01: El DTO valida campos requeridos."""
    response = await client.post("/api/v1/work-orders", json={
        # Sin title — deberÃ­a fallar
    })
    assert response.status_code == 422


async def test_change_status_validates_status_pattern(client):
    """P1-01: El DTO valida el patrÃ³n de new_status."""
    response = await client.post("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/status", json={
        "new_status": "INVALID_STATUS",  # Fuera del patrÃ³n
    })
    assert response.status_code == 422


async def test_add_part_validates_quantity_positive(client):
    """P1-01: El DTO valida que quantity sea > 0."""
    response = await client.post("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/parts", json={
        "part_id": "00000000-0000-0000-0000-000000000000",
        "quantity": 0,  # Debe ser > 0
    })
    assert response.status_code == 422


async def test_add_part_validates_uuid_format(client):
    """P1-01: El DTO valida formato UUID."""
    response = await client.post("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/parts", json={
        "part_id": "not-a-uuid",  # UUID invÃ¡lido
        "quantity": 1,
    })
    assert response.status_code == 422


async def test_assign_technician_validates_uuid_format(client):
    """P1-01: El DTO valida formato UUID del tÃ©cnico."""
    response = await client.post("/api/v1/work-orders/00000000-0000-0000-0000-000000000000/assign", json={
        "technician_id": "not-a-uuid",  # UUID invÃ¡lido
    })
    assert response.status_code == 422

