"""add unique constraint to work_order_parts

Revision ID: 004_wo_unique_constraint
Revises: 003
Create Date: 2026-10-29

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_wo_unique_constraint'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add unique constraint on work_order_parts(work_order_id, part_id)."""
    op.create_unique_constraint(
        'uq_work_order_part',
        'work_order_parts',
        ['work_order_id', 'part_id']
    )


def downgrade() -> None:
    """Remove unique constraint."""
    op.drop_constraint('uq_work_order_part', 'work_order_parts', type_='unique')
