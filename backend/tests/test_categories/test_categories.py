"""Tests de integraci\u00f3n para Categories."""

import pytest


async def test_list_categories_requires_auth(client):
    response = await client.get("/api/v1/categories")
    assert response.status_code == 401


async def test_create_category_requires_auth(client):
    response = await client.post("/api/v1/categories", json={"name": "Test"})
    assert response.status_code == 401
