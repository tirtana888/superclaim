"""Grant Supabase API roles access to SuperClaim tables

Revision ID: 004_grants
Revises: 003_policies
Create Date: 2026-06-23
"""

from typing import Sequence, Union

from alembic import op

revision: str = "004_grants"
down_revision: Union[str, None] = "003_policies"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("GRANT ALL ON TABLE tenants TO service_role")
    op.execute("GRANT ALL ON TABLE claims TO service_role")
    op.execute("GRANT ALL ON TABLE claim_image_hashes TO service_role")
    op.execute("GRANT ALL ON TABLE policies TO service_role")
    op.execute("GRANT ALL ON TABLE claim_policy_logs TO service_role")
    op.execute("GRANT SELECT ON TABLE tenants TO authenticated, anon")
    op.execute("GRANT SELECT ON TABLE claims TO authenticated, anon")
    op.execute("GRANT SELECT ON TABLE claim_image_hashes TO authenticated, anon")
    op.execute("GRANT SELECT ON TABLE policies TO authenticated, anon")
    op.execute("GRANT SELECT ON TABLE claim_policy_logs TO authenticated, anon")


def downgrade() -> None:
    op.execute("REVOKE ALL ON TABLE claim_policy_logs FROM service_role, authenticated, anon")
    op.execute("REVOKE ALL ON TABLE policies FROM service_role, authenticated, anon")
    op.execute("REVOKE ALL ON TABLE claim_image_hashes FROM service_role, authenticated, anon")
    op.execute("REVOKE ALL ON TABLE claims FROM service_role, authenticated, anon")
    op.execute("REVOKE ALL ON TABLE tenants FROM service_role, authenticated, anon")
