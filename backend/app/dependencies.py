"""Dependencies compartidas de FastAPI."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.domain.auth.user import User
from app.domain.auth.role import Permission
from app.infrastructure.auth.repositories.user_repo import UserRepository
from app.infrastructure.auth.services.token_service import TokenService

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency que extrae y valida el JWT del header Authorization.

    Returns:
        User object si el token es válido.

    Raises:
        HTTPException 401: Si el token es inválido o expirado.
    """
    try:
        payload = TokenService.validate_access_token(credentials.credentials)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


async def require_permission(
    resource: str,
    action: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency FastAPI que verifica si el usuario tiene un permiso específico.

    Args:
        resource: Recurso (assets, work_orders, inventory, etc.)
        action: Acción (create, read, update, delete)
        db: Session de base de datos
        current_user: Usuario autenticado

    Returns:
        User object si tiene el permiso.

    Raises:
        HTTPException 403: Si no tiene el permiso.
    """
    # Admin tiene todos los permisos implícitos
    if current_user.role_name == "Admin":
        return current_user

    # Verificar permisos en la base de datos
    result = await db.execute(
        select(Permission).where(
            Permission.role_id == current_user.role_id,
            Permission.resource == resource,
            Permission.action == action,
        )
    )
    has_permission = result.scalar_one_or_none() is not None

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tiene permisos para {action} {resource}",
        )

    return current_user


async def require_any_permission(
    permissions: List[tuple],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency FastAPI que verifica si el usuario tiene AL MENOS UN permiso de la lista.

    Args:
        permissions: Lista de tuplas (resource, action)
        db: Session de base de datos
        current_user: Usuario autenticado

    Returns:
        User object si tiene al menos un permiso.

    Raises:
        HTTPException 403: Si no tiene ningún permiso.
    """
    # Admin tiene todos los permisos implícitos
    if current_user.role_name == "Admin":
        return current_user

    # Verificar permisos en la base de datos
    result = await db.execute(
        select(Permission).where(
            Permission.role_id == current_user.role_id,
        )
    )
    user_permissions = result.scalars().all()

    has_any = any(
        perm.resource == resource and perm.action == action
        for perm in user_permissions
        for resource, action in permissions
    )

    if not has_any:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción",
        )

    return current_user
