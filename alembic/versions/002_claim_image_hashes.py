"""Add claim_image_hashes table

Revision ID: 002_claim_image_hashes
Revises: 001_initial
Create Date: 2026-06-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002_claim_image_hashes"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "claim_image_hashes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("claim_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("storage_path", sa.String(length=512), nullable=False),
        sa.Column("phash", sa.String(length=32), nullable=False),
        sa.Column("dhash", sa.String(length=32), nullable=False),
        sa.Column("image_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["claim_id"], ["claims.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_claim_image_hashes_tenant_id", "claim_image_hashes", ["tenant_id"])
    op.create_index("ix_claim_image_hashes_claim_id", "claim_image_hashes", ["claim_id"])
    op.create_index("ix_claim_image_hashes_phash", "claim_image_hashes", ["phash"])
    op.create_index("ix_claim_image_hashes_dhash", "claim_image_hashes", ["dhash"])


def downgrade() -> None:
    op.drop_index("ix_claim_image_hashes_dhash", table_name="claim_image_hashes")
    op.drop_index("ix_claim_image_hashes_phash", table_name="claim_image_hashes")
    op.drop_index("ix_claim_image_hashes_claim_id", table_name="claim_image_hashes")
    op.drop_index("ix_claim_image_hashes_tenant_id", table_name="claim_image_hashes")
    op.drop_table("claim_image_hashes")
