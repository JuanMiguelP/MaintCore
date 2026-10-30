"""Alembic environment configuration for async SQLAlchemy."""

import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import Base
from app.config import get_settings

# Import all domain models so Alembic can detect them
from app.domain.auth.user import User  # noqa: F401
from app.domain.auth.role import Role, Permission  # noqa: F401
from app.domain.assets.asset import Asset  # noqa: F401
from app.domain.assets.category import AssetCategory  # noqa: F401
from app.domain.assets.location import Location  # noqa: F401
from app.domain.audit.audit_log import AuditLog  # noqa: F401
from app.domain.inventory.supplier import Supplier  # noqa: F401
from app.domain.inventory.part import Part  # noqa: F401
from app.domain.inventory.stock_movement import StockMovement  # noqa: F401
from app.domain.auth.refresh_token import RefreshToken  # noqa: F401
from app.domain.work_orders.work_order import WorkOrder  # noqa: F401
from app.domain.work_orders.status_history import WorkOrderStatusHistory  # noqa: F401
from app.domain.work_orders.work_order_part import WorkOrderPart  # noqa: F401
from app.domain.preventive_maintenance.maintenance_plan import MaintenancePlan  # noqa: F401
from app.domain.preventive_maintenance.maintenance_plan_execution import MaintenancePlanExecution  # noqa: F401
from app.domain.notifications.notification_rule import NotificationRule  # noqa: F401
from app.domain.notifications.part_alert_state import PartAlertState  # noqa: F401
from app.domain.inventory.part_change_log import PartChangeLog  # noqa: F401

# Alembic Config object
config = context.config

# Override sqlalchemy.url from environment
db_url = os.getenv('DATABASE_URL', 'postgresql+asyncpg://maintcore:maintcore_secret_dev@localhost:5432/maintcore')
config.set_main_option('sqlalchemy.url', db_url)

# Logger
logger = __import__('logging').getLogger(__name__)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=Base.metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Run migrations with connection."""
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
