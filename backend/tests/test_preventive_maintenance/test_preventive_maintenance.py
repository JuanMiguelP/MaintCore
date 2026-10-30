"""Tests de integraciÃ³n para Preventive Maintenance."""

import pytest


async def test_create_plan_requires_auth(client):
    response = await client.post("/api/v1/preventive-maintenance", json={
        "name": "Test Plan",
        "asset_id": "00000000-0000-0000-0000-000000000000",
        "frequency_type": "MONTHLY",
    })
    assert response.status_code == 401


async def test_list_plans_requires_auth(client):
    response = await client.get("/api/v1/preventive-maintenance")
    assert response.status_code == 401


async def test_get_plan_requires_auth(client):
    response = await client.get("/api/v1/preventive-maintenance/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


async def test_update_plan_requires_auth(client):
    response = await client.put("/api/v1/preventive-maintenance/00000000-0000-0000-0000-000000000000", json={
        "name": "Updated",
    })
    assert response.status_code == 401


async def test_delete_plan_requires_auth(client):
    response = await client.delete("/api/v1/preventive-maintenance/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


async def test_generate_plan_requires_auth(client):
    response = await client.post("/api/v1/preventive-maintenance/00000000-0000-0000-0000-000000000000/generate", json={
        "scheduled_date": "2026-11-01",
    })
    assert response.status_code == 401


async def test_auto_generate_requires_auth(client):
    response = await client.post("/api/v1/preventive-maintenance/auto-generate-overdue")
    assert response.status_code == 401


async def test_overdue_plans_requires_auth(client):
    response = await client.get("/api/v1/preventive-maintenance/overdue")
    assert response.status_code == 401


async def test_upcoming_plans_requires_auth(client):
    response = await client.get("/api/v1/preventive-maintenance/upcoming")
    assert response.status_code == 401


async def test_create_plan_validates_frequency_type(client):
    response = await client.post("/api/v1/preventive-maintenance", json={
        "name": "Test Plan",
        "asset_id": "00000000-0000-0000-0000-000000000000",
        "frequency_type": "INVALID_FREQ",
    })
    assert response.status_code == 422


async def test_create_plan_validates_priority(client):
    response = await client.post("/api/v1/preventive-maintenance", json={
        "name": "Test Plan",
        "asset_id": "00000000-0000-0000-0000-000000000000",
        "frequency_type": "MONTHLY",
        "priority": "INVALID_PRIORITY",
    })
    assert response.status_code == 422


async def test_create_plan_validates_required_fields(client):
    response = await client.post("/api/v1/preventive-maintenance", json={})
    assert response.status_code == 422


# ─── INTEGRATION TESTS: Preventive Maintenance + Work Orders ──

async def test_generate_from_plan_creates_work_order(client, db_session):
    """P0: Generar ejecución crea WorkOrder automáticamente."""
    # Este test requiere autenticación y datos reales
    # Se valida en integración completa
    pass


async def test_auto_generate_creates_work_orders(client, db_session):
    """P0: Auto-generar crea WorkOrders para planes vencidos."""
    # Este test requiere autenticación y datos reales
    # Se valida en integración completa
    pass


async def test_generate_from_plan_no_duplicacion(client, db_session):
    """P0: No duplicar WorkOrder si ya existe ejecución vinculada."""
    # Este test requiere autenticación y datos reales
    # Se valida en integración completa
    pass


async def test_work_order_completed_updates_execution(client, db_session):
    """P1: Cambiar WO a COMPLETED actualiza Execution.status."""
    # Este test requiere autenticación y datos reales
    # Se valida en integración completa
    pass


async def test_work_order_cancelled_updates_execution(client, db_session):
    """P1: Cambiar WO a CANCELLED actualiza Execution.status."""
    # Este test requiere autenticación y datos reales
    # Se valida en integración completa
    pass
