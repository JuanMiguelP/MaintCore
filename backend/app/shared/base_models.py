"""Modelos base con UUID y timestamps para todos los ORM entities."""

import uuid
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, MappedAsDataclass
from typing_extensions import Annotated

from app.database import Base

# Columna UUID reutilizable
UuidType = Annotated[
    uuid.UUID,
    mapped_column(default_factory=uuid.uuid4, primary_key=True),
]

# Timestamp auto-managed
CreatedAt = Annotated[
    datetime,
    mapped_column(server_default=func.now()),
]

UpdatedAT = Annotated[
    datetime,
    mapped_column(server_default=func.now(), onupdate=func.now()),
]


class TimestampMixin:
    """Mezcla que a\u00f1ade created_at y updated_at."""

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


class UUIDBase(Base, MappedAsDataclass):
    """Base con UUID primary key para todos los modelos."""

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(default_factory=uuid.uuid4, primary_key=True)
