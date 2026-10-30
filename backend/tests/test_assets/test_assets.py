"""Tests de integraci\u00f3n para Assets."""

import pytest


async def test_create_asset_requires_auth(client):
    """Crear asset sin autenticaci\u00f3n retorna 401."""
    response = await client.post("/api/v1/assets", json={
        "code": "TEST-001",
        "name": "Test Asset",
        "category_id": "00000000-0000-0000-0000-000000000000",
    })
    assert response.status_code == 401


async def test_list_assets(client):
    """Listar assets sin autenticaci\u00f3n retorna 401."""
    response = await client.get("/api/v1/assets")
    assert response.status_code == 401


async def test_get_asset_requires_auth(client):
    """Obtener asset sin autenticaci\u00f3n retorna 401."""
    response = await client.get("/api/v1/assets/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401
