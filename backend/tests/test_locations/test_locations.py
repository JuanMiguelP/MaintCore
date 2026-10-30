"""Tests de integraci\u00f3n para Locations."""

import pytest


async def test_list_locations_requires_auth(client):
    response = await client.get("/api/v1/locations")
    assert response.status_code == 401


async def test_create_location_requires_auth(client):
    response = await client.post("/api/v1/locations", json={"name": "Test"})
    assert response.status_code == 401
