"""part_change_log_table

Revision ID: 007
Revises: 006_notification_tables
Create Date: 2025-01-01
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "007"
down_revision = "006_notification_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Crea la tabla part_change_logs para historial de cambios de productos."""
    op.create_table(
        "part_change_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("part_id", sa.Uuid(), nullable=False),
        sa.Column("field_name", sa.String(50), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("performed_by", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["part_id"], ["parts.id"]),
        sa.ForeignKeyConstraint(["performed_by"], ["users.id"]),
    )
    op.create_index(op.f("ix_part_change_logs_part_id"), "part_change_logs", ["part_id"], unique=False)
    op.create_index(op.f("ix_part_change_logs_performed_by"), "part_change_logs", ["performed_by"], unique=False)


def downgrade() -> None:
    """Elimina la tabla part_change_logs."""
    op.drop_index(op.f("ix_part_change_logs_performed_by"), table_name="part_change_logs")
    op.drop_index(op.f("ix_part_change_logs_part_id"), table_name="part_change_logs")
    op.drop_table("part_change_logs")
