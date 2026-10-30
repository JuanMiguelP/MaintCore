"""Modelo Role — Dominio de Autenticaci\u00f3n."""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Role(Base):
    """Rol del sistema con permisos asociados."""

    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_system: Mapped[bool] = mapped_column(default=False)  # Roles del sistema no se pueden eliminar
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", back_populates="role", lazy="selectin")


class Permission(Base):
    """Permiso individual asociado a un rol."""

    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    role_id: Mapped[uuid.UUID] = mapped_column(uuid.UUID, nullable=False)
    resource: Mapped[str] = mapped_column(String(50), nullable=False)  # assets, work_orders, etc.
    action: Mapped[str] = mapped_column(String(20), nullable=False)  # create, read, update, delete

    role = relationship("Role", back_populates="permissions")
