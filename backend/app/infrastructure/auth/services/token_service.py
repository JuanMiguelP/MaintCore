"""Servicio de tokens JWT usando python-jose."""

import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.config import get_settings


settings = get_settings()


class TokenService:
    """Generaci\u00f3n y validaci\u00f3n de tokens JWT."""

    ALGORITHM = settings.jwt_algorithm

    @staticmethod
    def create_access_token(user_id: str, username: str, expires_delta: timedelta | None = None) -> str:
        """Crea un access token con expiraci\u00f3n corta."""
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes))
        payload = {
            "sub": user_id,
            "username": username,
            "type": "access",
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Crea un refresh token con expiraci\u00f3n larga."""
        expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
        payload = {
            "sub": user_id,
            "type": "refresh",
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    @staticmethod
    def decode_token(token: str) -> dict | None:
        """Decodifica y valida un token JWT. Retorna payload o None si es inv\u00e1lido."""
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            return payload
        except jwt.JWTError:
            return None

    @staticmethod
    def validate_access_token(token: str) -> dict:
        """Valida un access token y retorna su payload. Lanza ValueError si es inv\u00e1lido."""
        payload = TokenService.decode_token(token)
        if payload is None or payload.get("type") != "access":
            raise ValueError("Invalid or expired access token")
        return payload

    @staticmethod
    def validate_refresh_token(token: str) -> dict:
        """Valida un refresh token y retorna su payload. Lanza ValueError si es inv\u00e1lido."""
        payload = TokenService.decode_token(token)
        if payload is None or payload.get("type") != "refresh":
            raise ValueError("Invalid or expired refresh token")
        return payload
