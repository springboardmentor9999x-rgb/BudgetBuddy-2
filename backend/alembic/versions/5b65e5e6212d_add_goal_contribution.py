"""add_goal_contribution

Revision ID: 5b65e5e6212d
Revises: 4ec6dfb2593b
Create Date: 2026-08-19 22:27:57.188505

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b65e5e6212d'
down_revision: Union[str, Sequence[str], None] = '4ec6dfb2593b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table('goal_contributions'):
        op.create_table(
            'goal_contributions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('goal_id', sa.Integer(), nullable=False),
            sa.Column('account_id', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('date', sa.DateTime(), nullable=False),
            sa.Column('description', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['goal_id'], ['savings_goals.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_goal_contributions_account_id'), 'goal_contributions', ['account_id'], unique=False)
        op.create_index(op.f('ix_goal_contributions_goal_id'), 'goal_contributions', ['goal_id'], unique=False)
        op.create_index(op.f('ix_goal_contributions_id'), 'goal_contributions', ['id'], unique=False)
        op.create_index(op.f('ix_goal_contributions_user_id'), 'goal_contributions', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if inspector.has_table('goal_contributions'):
        op.drop_index(op.f('ix_goal_contributions_user_id'), table_name='goal_contributions')
        op.drop_index(op.f('ix_goal_contributions_id'), table_name='goal_contributions')
        op.drop_index(op.f('ix_goal_contributions_goal_id'), table_name='goal_contributions')
        op.drop_index(op.f('ix_goal_contributions_account_id'), table_name='goal_contributions')
        op.drop_table('goal_contributions')
