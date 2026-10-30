"""Configuraci\u00f3n de la aplicaci\u00f3n usando pydantic-settings."""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuraci\u00f3n de la aplicaci\u00f3n."""

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://maintcore:maintcore_secret_dev@localhost:5432/maintcore",
        description="URL de conexi\u00f3n a PostgreSQL (async)",
    )

    # JWT
    jwt_secret_key: str = Field(
        default="change_me_to_a_secure_random_string_in_production",
        description="Clave secreta para firmar tokens JWT",
    )
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # CORS
    allowed_origins: List[str] = Field(
        default=["http://localhost:5173"],
        description="Or\u00edgenes permitidos para CORS",
    )

    # App
    app_name: str = "MaintCore CMMS"
    app_version: str = "0.1.0"

    # SMTP / Email Notifications
    smtp_host: str = Field(default="smtp.gmail.com", description="Servidor SMTP")
    smtp_port: int = Field(default=587, description="Puerto SMTP")
    smtp_username: str = Field(default="", description="Usuario SMTP")
    smtp_password: str = Field(default="", description="Contraseña SMTP")
    smtp_use_tls: bool = Field(default=True, description="Usar TLS")
    smtp_from_email: str = Field(default="", description="Email remitente")
    smtp_from_name: str = Field(default="MaintCore CMMS", description="Nombre remitente")

    @property
    def database_sync_url(self) -> str:
        """Convierte la URL async a sync para Alembic/SQLAlchemy engine."""
        return self.database_url.replace("postgresql+asyncpg://", "postgresql://")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    """Retorna instancia cacheada de Settings."""
    return Settings()
