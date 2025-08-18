"""create file_uploads table

Revision ID: 0001
Revises: 
Create Date: 2025-08-15 00:00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        create table if not exists file_uploads (
            id uuid primary key,
            filename text not null,
            path text not null,
            size_bytes bigint not null,
            content_type text,
            status text not null default 'uploaded',
            dataset_table text,
            rows_imported bigint default 0,
            created_at timestamp not null default now(),
            updated_at timestamp not null default now()
        );
        """
    )


def downgrade() -> None:
    op.execute("drop table if exists file_uploads;")
