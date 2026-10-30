"""Use Case: Refresh de token JWT."""

from app.infrastructure.auth.services.token_service import TokenService
from app.shared.exceptions import UnauthorizedError


async def refresh_token(refresh_token: str) -> dict:
    """Renueva un access token usando un refresh token v\u00e1lido.

    Args:
        refresh_token: Token de refresco emitido previamente.

    Returns:
        Nuevo par de access_token + refresh_token.

    Raises:
        UnauthorizedError: Si el refresh token es inv\u00e1lido o expirado.
    """
    payload = TokenService.validate_refresh_token(refresh_token)
    user_id = payload.get("sub")

    if not user_id:
        raise UnauthorizedError("Invalid refresh token")

    new_access = TokenService.create_access_token(user_id=user_id, username=user_id)
    new_refresh = TokenService.create_refresh_token(user_id=user_id)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "expires_in": 900,
    }
