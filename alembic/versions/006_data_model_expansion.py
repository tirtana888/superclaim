"""Data model expansion: devices, claim_events, usage_records, policy/claim columns

Revision ID: 006_data_model
Revises: 005_control_plane
Create Date: 2026-06-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_data_model"
down_revision: Union[str, None] = "005_control_plane"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- devices ---
    op.create_table(
        "devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("serial_number", sa.String(length=255), nullable=False),
        sa.Column("device_category", sa.String(length=100), nullable=False),
        sa.Column("device_model", sa.String(length=255), nullable=True),
        sa.Column("purchase_date", sa.Date(), nullable=True),
        sa.Column("warranty_months", sa.Integer(), nullable=True),
        sa.Column("customer_ref", sa.String(length=255), nullable=True),
        sa.Column("batch_id", sa.String(length=255), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=False, server_default="manual"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "serial_number", name="uq_devices_tenant_serial"),
    )
    op.create_index("ix_devices_tenant_id", "devices", ["tenant_id"])

    # --- claim_events ---
    op.create_table(
        "claim_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("claim_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("actor", sa.String(length=255), nullable=False),
        sa.Column(
            "detail_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["claim_id"], ["claims.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_claim_events_tenant_id", "claim_events", ["tenant_id"])
    op.create_index("ix_claim_events_claim_id", "claim_events", ["claim_id"])

    # --- usage_records ---
    op.create_table(
        "usage_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("period", sa.String(length=7), nullable=False),
        sa.Column("claims_processed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ai_cost_total", sa.Float(), nullable=False, server_default="0"),
        sa.Column("billable_amount", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "period", name="uq_usage_records_tenant_period"),
    )
    op.create_index("ix_usage_records_tenant_id", "usage_records", ["tenant_id"])

    # --- expand policies ---
    op.add_column("policies", sa.Column("name", sa.String(length=255), nullable=True))
    op.add_column(
        "policies",
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
    )
    op.add_column(
        "policies",
        sa.Column("rules_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "policies", sa.Column("effective_from", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("policies", sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_policies_created_by_users",
        "policies",
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.execute("UPDATE policies SET rules_json = config WHERE rules_json IS NULL")
    op.execute("UPDATE policies SET name = external_policy_id WHERE name IS NULL")

    # --- expand claims ---
    op.add_column("claims", sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("claims", sa.Column("decision", sa.String(length=50), nullable=True))
    op.add_column("claims", sa.Column("confidence_score", sa.Float(), nullable=True))
    op.add_column("claims", sa.Column("fraud_score", sa.Float(), nullable=True))
    op.add_column("claims", sa.Column("requires_review", sa.Boolean(), nullable=True))
    op.add_column(
        "claims",
        sa.Column(
            "payload_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.add_column(
        "claims", sa.Column("result_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
    op.add_column("claims", sa.Column("ai_cost_usd", sa.Float(), nullable=True))
    op.create_foreign_key(
        "fk_claims_device_id_devices",
        "claims",
        "devices",
        ["device_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_claims_device_id", "claims", ["device_id"])

    # --- tenant_id on claim_policy_logs ---
    op.add_column(
        "claim_policy_logs", sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.execute(
        """
        UPDATE claim_policy_logs cpl
        SET tenant_id = c.tenant_id
        FROM claims c
        WHERE cpl.claim_id = c.id AND cpl.tenant_id IS NULL
        """
    )
    op.alter_column("claim_policy_logs", "tenant_id", nullable=False)
    op.create_foreign_key(
        "fk_claim_policy_logs_tenant_id_tenants",
        "claim_policy_logs",
        "tenants",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_claim_policy_logs_tenant_id", "claim_policy_logs", ["tenant_id"])

    # --- grants ---
    op.execute("GRANT ALL ON TABLE devices TO service_role")
    op.execute("GRANT ALL ON TABLE claim_events TO service_role")
    op.execute("GRANT ALL ON TABLE usage_records TO service_role")


def downgrade() -> None:
    op.execute("REVOKE ALL ON TABLE usage_records FROM service_role")
    op.execute("REVOKE ALL ON TABLE claim_events FROM service_role")
    op.execute("REVOKE ALL ON TABLE devices FROM service_role")
    op.drop_index("ix_claim_policy_logs_tenant_id", table_name="claim_policy_logs")
    op.drop_constraint(
        "fk_claim_policy_logs_tenant_id_tenants", "claim_policy_logs", type_="foreignkey"
    )
    op.drop_column("claim_policy_logs", "tenant_id")
    op.drop_index("ix_claims_device_id", table_name="claims")
    op.drop_constraint("fk_claims_device_id_devices", "claims", type_="foreignkey")
    op.drop_column("claims", "ai_cost_usd")
    op.drop_column("claims", "result_json")
    op.drop_column("claims", "payload_json")
    op.drop_column("claims", "requires_review")
    op.drop_column("claims", "fraud_score")
    op.drop_column("claims", "confidence_score")
    op.drop_column("claims", "decision")
    op.drop_column("claims", "device_id")
    op.drop_constraint("fk_policies_created_by_users", "policies", type_="foreignkey")
    op.drop_column("policies", "created_by")
    op.drop_column("policies", "effective_from")
    op.drop_column("policies", "rules_json")
    op.drop_column("policies", "status")
    op.drop_column("policies", "name")
    op.drop_index("ix_usage_records_tenant_id", table_name="usage_records")
    op.drop_table("usage_records")
    op.drop_index("ix_claim_events_claim_id", table_name="claim_events")
    op.drop_index("ix_claim_events_tenant_id", table_name="claim_events")
    op.drop_table("claim_events")
    op.drop_index("ix_devices_tenant_id", table_name="devices")
    op.drop_table("devices")
