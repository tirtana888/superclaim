"""Sales reps, commission settings, and dealer onboarding bonuses

Revision ID: 008_sales_reps
Revises: 007_platform_admins
Create Date: 2026-06-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008_sales_reps"
down_revision: Union[str, None] = "007_platform_admins"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sales_reps",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column("onboarding_bonus_override", sa.Float(), nullable=True),
        sa.Column("revenue_rate_override", sa.Float(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_sales_reps_email"),
    )

    op.create_table(
        "commission_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("default_onboarding_bonus", sa.Float(), nullable=False, server_default="50.0"),
        sa.Column("default_revenue_rate", sa.Float(), nullable=False, server_default="0.05"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "sales_bonus_awards",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sales_rep_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", name="uq_sales_bonus_awards_tenant"),
        sa.ForeignKeyConstraint(["sales_rep_id"], ["sales_reps.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_sales_bonus_awards_sales_rep_id", "sales_bonus_awards", ["sales_rep_id"]
    )

    op.add_column(
        "tenants",
        sa.Column("onboarded_by_sales_rep_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        "ix_tenants_onboarded_by_sales_rep_id", "tenants", ["onboarded_by_sales_rep_id"]
    )
    op.create_foreign_key(
        "fk_tenants_onboarded_by_sales_rep_id",
        "tenants",
        "sales_reps",
        ["onboarded_by_sales_rep_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.execute("GRANT ALL ON TABLE sales_reps TO service_role")
    op.execute("GRANT ALL ON TABLE commission_settings TO service_role")
    op.execute("GRANT ALL ON TABLE sales_bonus_awards TO service_role")


def downgrade() -> None:
    op.drop_constraint("fk_tenants_onboarded_by_sales_rep_id", "tenants", type_="foreignkey")
    op.drop_index("ix_tenants_onboarded_by_sales_rep_id", table_name="tenants")
    op.drop_column("tenants", "onboarded_by_sales_rep_id")

    op.drop_index("ix_sales_bonus_awards_sales_rep_id", table_name="sales_bonus_awards")
    op.drop_table("sales_bonus_awards")
    op.drop_table("commission_settings")
    op.drop_table("sales_reps")
