"""Baseline: the schema previously created by Base.metadata.create_all.

Uses IF NOT EXISTS so it applies cleanly to both a fresh database and the
existing production database that create_all built.

Revision ID: 0001
Revises:
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

STATEMENTS = [
    """CREATE TABLE IF NOT EXISTS documents (
        id UUID NOT NULL,
        image_key VARCHAR(255) NOT NULL,
        section VARCHAR(16) NOT NULL,
        source VARCHAR(32) NOT NULL,
        expected_text TEXT,
        lines_requested INTEGER,
        lines_found INTEGER,
        status VARCHAR(16) NOT NULL,
        error VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        segmented_at TIMESTAMP WITH TIME ZONE,
        PRIMARY KEY (id)
    )""",
    "CREATE INDEX IF NOT EXISTS ix_documents_image_key ON documents (image_key)",
    """CREATE TABLE IF NOT EXISTS samples (
        id UUID NOT NULL,
        image_key VARCHAR(255) NOT NULL,
        expected_text TEXT,
        annotated_text TEXT,
        ocr_text TEXT,
        lines INTEGER,
        source VARCHAR(32) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        annotated_at TIMESTAMP WITH TIME ZONE,
        PRIMARY KEY (id),
        UNIQUE (image_key)
    )""",
    """CREATE TABLE IF NOT EXISTS users (
        id UUID NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        PRIMARY KEY (id)
    )""",
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)",
    """CREATE TABLE IF NOT EXISTS daily_usage (
        id UUID NOT NULL,
        user_id UUID,
        ip VARCHAR(45) NOT NULL,
        date DATE NOT NULL,
        count INTEGER,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )""",
    "CREATE INDEX IF NOT EXISTS ix_daily_usage_ip ON daily_usage (ip)",
    """CREATE TABLE IF NOT EXISTS segments (
        id UUID NOT NULL,
        document_id UUID NOT NULL,
        kind VARCHAR(16) NOT NULL,
        index INTEGER NOT NULL,
        image_key VARCHAR(255) NOT NULL,
        bbox JSONB,
        expected_text TEXT,
        annotated_text TEXT,
        annotated_at TIMESTAMP WITH TIME ZONE,
        is_extra BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        PRIMARY KEY (id),
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
    )""",
    "CREATE INDEX IF NOT EXISTS ix_segments_document_id ON segments (document_id)",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    for table in ("segments", "daily_usage", "users", "samples", "documents"):
        op.execute(f"DROP TABLE IF EXISTS {table}")
