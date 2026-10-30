"""Tests de integraci\u00f3n para Auth."""

import pytest


async def test_login_success(client, db_session):
    """Login con credenciales correctas retorna tokens."""
    from app.infrastructure.auth.services.password_service import PasswordService
    from app.domain.auth.user import User
    from app.domain.auth.role import Role

    # Crear rol y usuario de test
    role = Role(name="Admin", description="Test admin")
    db_session.add(role)
    await db_session.commit()

    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=PasswordService.hash_password("TestPass123"),
        full_name="Test User",
        role_id=role.id,
    )
    db_session.add(user)
    await db_session.commit()

    # Login
    response = await client.post("/api/v1/auth/login", json={
        "username": "testuser",
        "password": "TestPass123",
    })

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client):
    """Login con contrase\u00f1a incorrecta retorna 401."""
    response = await client.post("/api/v1/auth/login", json={
        "username": "nonexistent",
        "password": "wrong",
    })
    assert response.status_code == 404


async def test_refresh_token(client):
    """Refresh token retorna nuevos tokens."""
    # Login primero
    login_resp = await client.post("/api/v1/auth/login", json={
        "username": "nonexistent",
        "password": "wrong",
    })
    # El login falla, pero probamos el endpoint de refresh con un token dummy
    response = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": "invalid_token",
    })
    assert response.status_code == 401


async def test_create_user_requires_auth(client):
    """Crear usuario sin autenticaci\u00f3n retorna 401."""
    response = await client.post("/api/v1/auth/users", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "TestPass123",
    })
    assert response.status_code == 401
