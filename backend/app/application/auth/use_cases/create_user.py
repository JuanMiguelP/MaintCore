"""Use Case: Crear nuevo usuario."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.auth.user import User
from app.infrastructure.auth.services.password_service import PasswordService
from app.shared.exceptions import ConflictError


async def create_user(
    db: AsyncSession,
    username: str,
    email: str,
    password: str,
    full_name: str | None = None,
    role_id: str | None = None,
) -> dict:
    """Crea un nuevo usuario en el sistema.

    Args:
        db: Sesi\u00f3n de base de datos async.
        username: Nombre de usuario \u00fanico.
        email: Email \u00fanico.
        password: Contrase\u00f1a en texto plano (se hash).
        full_name: Nombre completo opcional.
        role_id: ID del rol (opcional, por defecto None).

    Returns:
        Dict con datos del usuario creado.

    Raises:
        ConflictError: Si el username o email ya existen.
    """
    # Verificar unicidad
    existing = await db.execute(select(User).where((User.username == username) | (User.email == email)))
    if existing.scalar_one_or_none():
        raise ConflictError("Username or email already exists")

    user = User(
        username=username,
        email=email,
        hashed_password=PasswordService.hash_password(password),
        full_name=full_name,
        role_id=uuid.UUID(role_id) if role_id else None,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role_name": user.role.name if user.role else None,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
    }
