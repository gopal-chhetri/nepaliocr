"""Record who annotated a segment; drop the never-used daily_usage table.

Revision ID: 0002
Revises: 0001
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE segments ADD COLUMN IF NOT EXISTS annotated_by UUID "
        "REFERENCES users (id) ON DELETE SET NULL"
    )
    # Daily quotas live in Redis; nothing ever wrote to this table.
    op.execute("DROP TABLE IF EXISTS daily_usage")


def downgrade() -> None:
    op.execute(
        """CREATE TABLE IF NOT EXISTS daily_usage (
            id UUID NOT NULL,
            user_id UUID,
            ip VARCHAR(45) NOT NULL,
            date DATE NOT NULL,
            count INTEGER,
            PRIMARY KEY (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )"""
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_daily_usage_ip ON daily_usage (ip)")
    op.execute("ALTER TABLE segments DROP COLUMN IF EXISTS annotated_by")
