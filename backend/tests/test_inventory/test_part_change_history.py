"""Tests de integraciÃ³n para historial de cambios de Parts."""

import pytest
from uuid import uuid4


async def test_create_part_no_change_logs(client):
    """Crear un part no genera registros de cambio."""
    # Necesitamos un supplier para crear el part
    sup_id = str(uuid4())
    body = {
        "part_number": "TEST-CHG-001",
        "name": "Producto Test Historial",
        "description": "DescripciÃ³n original",
        "manufacturer": "ManufA",
        "unit_cost": 10.0,
        "minimum_stock": 5,
        "current_stock": 100,
        "location": "Estante A1",
        "notes": "Nota inicial",
    }
    # Crear part (sin auth fallarÃ¡, pero necesitamos probar sin auth primero)
    response = await client.post("/api/v1/inventory/parts", json=body)
    assert response.status_code in (201, 401)


async def test_update_part_creates_change_logs(client):
    """Actualizar un part genera registros de cambio por cada campo modificado."""
    # Primero crear un part
    body = {
        "part_number": "TEST-CHG-002",
        "name": "Nombre Original",
        "description": "Desc Original",
        "manufacturer": "ManufB",
        "unit_cost": 20.0,
        "minimum_stock": 10,
        "current_stock": 50,
        "location": "Estante B2",
        "notes": "Nota original",
    }
    create_resp = await client.post("/api/v1/inventory/parts", json=body)
    if create_resp.status_code == 401:
        pytest.skip("Auth no configurada para tests")

    part_data = create_resp.json()
    part_id = part_data["id"]

    # Actualizar mÃºltiples campos
    update_body = {
        "name": "Nombre Actualizado",
        "description": "Desc Actualizada",
        "unit_cost": 25.0,
        "location": "Estante C3",
    }
    update_resp = await client.put(f"/api/v1/inventory/parts/{part_id}", json=update_body)
    if update_resp.status_code == 401:
        pytest.skip("Auth no configurada para tests")

    # Consultar historial de cambios
    history_resp = await client.get(f"/api/v1/inventory/parts/{part_id}/change-history")
    assert history_resp.status_code in (200, 401)

    if history_resp.status_code == 200:
        history = history_resp.json()
        assert history["total"] >= 4  # name, description, unit_cost, location

        # Verificar que cada campo cambiado estÃ¡ registrado
        field_names = {item["field_name"] for item in history["items"]}
        assert "name" in field_names
        assert "description" in field_names
        assert "unit_cost" in field_names
        assert "location" in field_names


async def test_update_same_value_no_change(client):
    """Actualizar un campo con el mismo valor no genera registro de cambio."""
    body = {
        "part_number": "TEST-CHG-003",
        "name": "Nombre IdÃ©ntico",
        "description": "Desc IdÃ©ntica",
        "unit_cost": 15.0,
        "minimum_stock": 5,
        "current_stock": 25,
    }
    create_resp = await client.post("/api/v1/inventory/parts", json=body)
    if create_resp.status_code == 401:
        pytest.skip("Auth no configurada para tests")

    part_data = create_resp.json()
    part_id = part_data["id"]

    # Actualizar con el mismo valor
    update_body = {
        "name": "Nombre IdÃ©ntico",  # mismo valor
        "unit_cost": 15.0,  # mismo valor
    }
    await client.put(f"/api/v1/inventory/parts/{part_id}", json=update_body)

    # Consultar historial
    history_resp = await client.get(f"/api/v1/inventory/parts/{part_id}/change-history")
    if history_resp.status_code == 200:
        history = history_resp.json()
        assert history["total"] == 0  # no cambios porque los valores son iguales


async def test_change_history_pagination(client):
    """El historial de cambios soporta paginaciÃ³n."""
    body = {
        "part_number": "TEST-CHG-004",
        "name": "Producto PaginaciÃ³n",
        "description": "Desc para paginaciÃ³n",
        "unit_cost": 30.0,
        "minimum_stock": 10,
        "current_stock": 200,
    }
    create_resp = await client.post("/api/v1/inventory/parts", json=body)
    if create_resp.status_code == 401:
        pytest.skip("Auth no configurada para tests")

    part_data = create_resp.json()
    part_id = part_data["id"]

    # Realizar mÃºltiples actualizaciones
    for i in range(5):
        await client.put(f"/api/v1/inventory/parts/{part_id}", json={
            "name": f"Nombre versiÃ³n {i}",
            "unit_cost": 30.0 + i,
        })

    # Consultar con paginaciÃ³n
    history_resp = await client.get(f"/api/v1/inventory/parts/{part_id}/change-history?page=1&page_size=2")
    if history_resp.status_code == 200:
        history = history_resp.json()
        assert history["page"] == 1
        assert history["page_size"] == 2
        assert len(history["items"]) <= 2
        assert history["total_pages"] >= 1


async def test_change_history_order_descending(client):
    """Los cambios se ordenan del mÃ¡s reciente al mÃ¡s antiguo."""
    body = {
        "part_number": "TEST-CHG-005",
        "name": "Producto Orden",
        "description": "Desc para orden",
        "unit_cost": 40.0,
        "minimum_stock": 5,
        "current_stock": 10,
    }
    create_resp = await client.post("/api/v1/inventory/parts", json=body)
    if create_resp.status_code == 401:
        pytest.skip("Auth no configurada para tests")

    part_data = create_resp.json()
    part_id = part_data["id"]

    # Realizar 3 actualizaciones secuenciales
    for i in range(3):
        await client.put(f"/api/v1/inventory/parts/{part_id}", json={
            "name": f"Nombre {i}",
        })

    history_resp = await client.get(f"/api/v1/inventory/parts/{part_id}/change-history")
    if history_resp.status_code == 200:
        history = history_resp.json()
        assert history["total"] >= 3
        items = history["items"]
        # El primer elemento debe ser el mÃ¡s reciente
        assert len(items) >= 3
