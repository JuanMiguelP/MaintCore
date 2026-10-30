"""Use Case: Login de usuario."""

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.auth.user import User
from app.infrastructure.auth.services.password_service import PasswordService
from app.infrastructure.auth.services.token_service import TokenService
from app.shared.exceptions import UnauthorizedError, NotFoundError


async def login(db: AsyncSession, username: str, password: str) -> dict:
    """Autentica usuario y retorna tokens JWT.

    Args:
        db: Sesi\u00f3n de base de datos async.
        username: Nombre de usuario.
        password: Contrase\u00f1a en texto plano.

    Returns:
        Dict con access_token, refresh_token, token_type y expires_in.

    Raises:
        NotFoundError: Si el usuario no existe.
        UnauthorizedError: Si la contrase\u00f1a es incorrecta o usuario inactivo.
    """
    stmt = select(User).where(User.username == username).options(
        selectinload(User.role)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User", username)

    if not user.is_active:
        raise UnauthorizedError("Usuario desactivado. Contacte al administrador.")

    if not PasswordService.verify_password(password, user.hashed_password):
        raise UnauthorizedError("Credenciales incorrectas.")

    access_token = TokenService.create_access_token(user_id=str(user.id), username=user.username)
    refresh_token = TokenService.create_refresh_token(user_id=str(user.id))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 900,
    }

