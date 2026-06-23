"""Control plane: users, api_credentials, and tenant columns

Revision ID: 005_control_plane
Revises: 004_grants
Create Date: 2026-06-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005_control_plane"
down_revision: Union[str, None] = "004_grants"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- expand tenants ---
    op.add_column("tenants", sa.Column("slug", sa.String(length=255), nullable=True))
    op.add_column(
        "tenants",
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
    )
    op.add_column(
        "tenants",
        sa.Column("plan_tier", sa.String(length=50), nullable=False, server_default="trial"),
    )
    op.create_unique_constraint("uq_tenants_slug", "tenants", ["slug"])

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="owner"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
    )
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    # --- api_credentials ---
    op.create_table(
        "api_credentials",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("key_id", sa.String(length=64), nullable=False),
        sa.Column("secret_hash", sa.String(length=255), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column(
            "scopes",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_id", name="uq_api_credentials_key_id"),
    )
    op.create_index("ix_api_credentials_tenant_id", "api_credentials", ["tenant_id"])
    op.create_index("ix_api_credentials_key_id", "api_credentials", ["key_id"])

    # --- grants for Supabase roles (consistent with migration 004) ---
    op.execute("GRANT ALL ON TABLE users TO service_role")
    op.execute("GRANT ALL ON TABLE api_credentials TO service_role")


def downgrade() -> None:
    op.execute("REVOKE ALL ON TABLE api_credentials FROM service_role")
    op.execute("REVOKE ALL ON TABLE users FROM service_role")
    op.drop_index("ix_api_credentials_key_id", table_name="api_credentials")
    op.drop_index("ix_api_credentials_tenant_id", table_name="api_credentials")
    op.drop_table("api_credentials")
    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_table("users")
    op.drop_constraint("uq_tenants_slug", "tenants", type_="unique")
    op.drop_column("tenants", "plan_tier")
    op.drop_column("tenants", "status")
    op.drop_column("tenants", "slug")
