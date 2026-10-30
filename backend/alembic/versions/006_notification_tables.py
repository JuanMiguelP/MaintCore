"""add notification tables

Revision ID: 006_notification_tables
Revises: 005_pm_tables
Create Date: 2026-10-29

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_notification_tables'
down_revision = '005_pm_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create notification_rules and part_alert_states tables."""
    op.create_table(
        'notification_rules',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('recipients', sa.JSON(), nullable=False),
        sa.Column('frequency', sa.String(20), nullable=False, server_default='ON_CHANGE'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notification_rules_event_type', 'notification_rules', ['event_type'])

    op.create_table(
        'part_alert_states',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('part_id', sa.Uuid(), nullable=False),
        sa.Column('is_low_stock', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_out_of_stock', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_notification_sent', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('part_id', name='uq_part_alert_state_part_id'),
        sa.ForeignKeyConstraint(['part_id'], ['parts.id']),
    )
    op.create_index('ix_part_alert_states_part_id', 'part_alert_states', ['part_id'])


def downgrade() -> None:
    """Drop notification tables."""
    op.drop_table('part_alert_states')
    op.drop_table('notification_rules')
