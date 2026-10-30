"""add preventive maintenance tables

Revision ID: 005_pm_tables
Revises: 004_wo_unique_constraint
Create Date: 2026-10-29

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_pm_tables'
down_revision = '004_wo_unique_constraint'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create maintenance_plans and maintenance_plan_executions tables."""
    op.create_table(
        'maintenance_plans',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('asset_id', sa.Uuid(), nullable=False),
        sa.Column('frequency_type', sa.String(20), nullable=False),
        sa.Column('frequency_value', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('estimated_hours', sa.Float(), nullable=True),
        sa.Column('priority', sa.String(20), nullable=False, server_default='MEDIUM'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_generated_at', sa.DateTime(), nullable=True),
        sa.Column('next_due_date', sa.Date(), nullable=True),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code', name='uq_maintenance_plan_code'),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
    )
    op.create_index('ix_maintenance_plans_code', 'maintenance_plans', ['code'])
    op.create_index('ix_maintenance_plans_asset_id', 'maintenance_plans', ['asset_id'])
    op.create_index('ix_maintenance_plans_next_due_date', 'maintenance_plans', ['next_due_date'])

    op.create_table(
        'maintenance_plan_executions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('plan_id', sa.Uuid(), nullable=False),
        sa.Column('work_order_id', sa.Uuid(), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=False),
        sa.Column('generated_by', sa.String(50), nullable=False, server_default='SYSTEM'),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plan_id', 'scheduled_date', name='uq_pm_execution_plan_date'),
        sa.UniqueConstraint('work_order_id', name='uq_pm_execution_work_order'),
        sa.ForeignKeyConstraint(['plan_id'], ['maintenance_plans.id']),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id']),
    )
    op.create_index('ix_maintenance_plan_executions_plan_id', 'maintenance_plan_executions', ['plan_id'])
    op.create_index('ix_maintenance_plan_executions_work_order_id', 'maintenance_plan_executions', ['work_order_id'])
    op.create_index('ix_maintenance_plan_executions_scheduled_date', 'maintenance_plan_executions', ['scheduled_date'])


def downgrade() -> None:
    """Drop preventive maintenance tables."""
    op.drop_table('maintenance_plan_executions')
    op.drop_table('maintenance_plans')
