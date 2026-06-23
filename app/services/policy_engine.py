import logging
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.policy import ClaimPolicyLog, Policy
from app.schemas.policy import PolicyConfig, PolicyEvaluationResult, RuleResult

logger = logging.getLogger(__name__)

DEFAULT_POLICY_CONFIG = PolicyConfig(
    warranty_months=12,
    covered_device_categories=["smartphone", "tablet", "laptop", "smartwatch", "earbuds"],
    covered_damage_types=[
        "cracked_screen",
        "screen",
        "water_damage",
        "water",
        "battery",
        "power",
        "charging",
    ],
    max_claims_per_serial=2,
    cooling_period_days=30,
)


async def _load_policy(
    db: AsyncSession,
    tenant_id: UUID,
    external_policy_id: str | None,
) -> tuple[Policy | None, PolicyConfig]:
    if not external_policy_id:
        return None, DEFAULT_POLICY_CONFIG

    result = await db.execute(
        select(Policy)
        .where(
            Policy.tenant_id == tenant_id,
            Policy.external_policy_id == external_policy_id,
            Policy.is_active.is_(True),
        )
        .order_by(Policy.version.desc())
        .limit(1)
    )
    policy = result.scalar_one_or_none()
    if policy is None:
        return None, DEFAULT_POLICY_CONFIG
    return policy, PolicyConfig.model_validate(policy.config)


def _rule_warranty_active(
    config: PolicyConfig,
    purchase_date: date | None,
    claim_date: date | None,
) -> RuleResult:
    rule_id = "warranty_active"
    if purchase_date is None or claim_date is None:
        return RuleResult(
            rule_id=rule_id,
            passed=False,
            reason="Purchase date and claim date are required for warranty validation",
        )
    warranty_end = purchase_date + timedelta(days=config.warranty_months * 30)
    if claim_date > warranty_end:
        return RuleResult(
            rule_id=rule_id,
            passed=False,
            reason=f"Claim date {claim_date} is after warranty end {warranty_end}",
        )
    return RuleResult(
        rule_id=rule_id,
        passed=True,
        reason=f"Warranty active until {warranty_end}",
    )


def _rule_device_covered(config: PolicyConfig, device_category: str) -> RuleResult:
    rule_id = "device_covered"
    if not config.covered_device_categories:
        return RuleResult(rule_id=rule_id, passed=True, reason="All device categories covered")
    normalized = device_category.strip().lower()
    covered = {item.lower() for item in config.covered_device_categories}
    if normalized in covered:
        return RuleResult(
            rule_id=rule_id,
            passed=True,
            reason=f"Device category '{device_category}' is covered",
        )
    return RuleResult(
        rule_id=rule_id,
        passed=False,
        reason=f"Device category '{device_category}' is not covered by policy",
    )


def _damage_is_covered(
    config: PolicyConfig,
    damage_description: str | None,
    damage_type: str | None,
) -> bool:
    if not config.covered_damage_types:
        return True
    covered = {item.lower() for item in config.covered_damage_types}
    if damage_type and damage_type.lower() in covered:
        return True
    description = (damage_description or "").lower()
    return any(
        covered_type in description or covered_type.replace("_", " ") in description
        for covered_type in covered
    )


def _rule_damage_covered(
    config: PolicyConfig,
    damage_description: str | None,
    damage_type: str | None,
) -> RuleResult:
    rule_id = "damage_covered"
    if _damage_is_covered(config, damage_description, damage_type):
        return RuleResult(rule_id=rule_id, passed=True, reason="Damage type is covered")
    return RuleResult(
        rule_id=rule_id,
        passed=False,
        reason="Damage type or description is not covered by policy",
    )


async def _count_approved_claims_for_serial(
    db: AsyncSession,
    tenant_id: UUID,
    serial_number: str,
    exclude_claim_id: UUID | None = None,
) -> int:
    query = select(func.count()).select_from(Claim).where(
        Claim.tenant_id == tenant_id,
        Claim.serial_number_input == serial_number,
        Claim.status.in_(("approved", "APPROVE")),
    )
    if exclude_claim_id is not None:
        query = query.where(Claim.id != exclude_claim_id)
    result = await db.execute(query)
    return int(result.scalar_one())


async def _latest_approved_claim_date(
    db: AsyncSession,
    tenant_id: UUID,
    serial_number: str,
    exclude_claim_id: UUID | None = None,
) -> date | None:
    query = (
        select(Claim.claim_date)
        .where(
            Claim.tenant_id == tenant_id,
            Claim.serial_number_input == serial_number,
            Claim.status.in_(("approved", "APPROVE")),
            Claim.claim_date.is_not(None),
        )
        .order_by(Claim.claim_date.desc())
        .limit(1)
    )
    if exclude_claim_id is not None:
        query = query.where(Claim.id != exclude_claim_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def _rule_claim_limit(
    db: AsyncSession,
    config: PolicyConfig,
    tenant_id: UUID,
    serial_number: str | None,
    exclude_claim_id: UUID | None,
) -> RuleResult:
    rule_id = "claim_limit"
    if not serial_number:
        return RuleResult(
            rule_id=rule_id,
            passed=False,
            reason="Serial number is required for claim limit validation",
        )
    approved_count = await _count_approved_claims_for_serial(
        db,
        tenant_id,
        serial_number,
        exclude_claim_id=exclude_claim_id,
    )
    if approved_count >= config.max_claims_per_serial:
        return RuleResult(
            rule_id=rule_id,
            passed=False,
            reason=(
                f"Serial {serial_number} already has {approved_count} approved claims "
                f"(limit {config.max_claims_per_serial})"
            ),
        )
    return RuleResult(
        rule_id=rule_id,
        passed=True,
        reason=f"Claim count {approved_count} is below limit {config.max_claims_per_serial}",
    )


async def _rule_cooling_period(
    db: AsyncSession,
    config: PolicyConfig,
    tenant_id: UUID,
    serial_number: str | None,
    claim_date: date | None,
    exclude_claim_id: UUID | None,
) -> RuleResult:
    rule_id = "cooling_period"
    if config.cooling_period_days == 0:
        return RuleResult(rule_id=rule_id, passed=True, reason="Cooling period disabled")
    if not serial_number or claim_date is None:
        return RuleResult(
            rule_id=rule_id,
            passed=False,
            reason="Serial number and claim date are required for cooling period validation",
        )

    last_claim_date = await _latest_approved_claim_date(
        db,
        tenant_id,
        serial_number,
        exclude_claim_id=exclude_claim_id,
    )
    if last_claim_date is None:
        return RuleResult(rule_id=rule_id, passed=True, reason="No prior approved claims on serial")

    earliest_allowed = last_claim_date + timedelta(days=config.cooling_period_days)
    if claim_date < earliest_allowed:
        return RuleResult(
            rule_id=rule_id,
            passed=False,
            reason=(
                f"Cooling period active until {earliest_allowed} "
                f"(last claim {last_claim_date})"
            ),
        )
    return RuleResult(
        rule_id=rule_id,
        passed=True,
        reason=f"Cooling period satisfied (last claim {last_claim_date})",
    )


async def _log_rules(
    db: AsyncSession,
    claim_id: UUID,
    policy: Policy | None,
    rules: list[RuleResult],
) -> None:
    if policy is None:
        return
    for rule in rules:
        db.add(
            ClaimPolicyLog(
                claim_id=claim_id,
                policy_id=policy.id,
                rule_id=rule.rule_id,
                passed=rule.passed,
                reason=rule.reason,
            )
        )
    await db.flush()


async def evaluate_policy(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    claim_id: UUID,
    external_policy_id: str | None,
    device_category: str,
    damage_description: str | None = None,
    damage_type: str | None = None,
    purchase_date: date | None = None,
    claim_date: date | None = None,
    serial_number: str | None = None,
) -> PolicyEvaluationResult:
    """Run deterministic policy rules. No AI — rules only."""
    policy, config = await _load_policy(db, tenant_id, external_policy_id)

    rules: list[RuleResult] = [
        _rule_warranty_active(config, purchase_date, claim_date),
        _rule_device_covered(config, device_category),
        _rule_damage_covered(config, damage_description, damage_type),
        await _rule_claim_limit(db, config, tenant_id, serial_number, claim_id),
        await _rule_cooling_period(
            db,
            config,
            tenant_id,
            serial_number,
            claim_date,
            claim_id,
        ),
    ]

    await _log_rules(db, claim_id, policy, rules)

    failed = next((rule for rule in rules if not rule.passed), None)
    covered = failed is None

    logger.info(
        "Policy evaluation claim_id=%s covered=%s rule_fired=%s",
        claim_id,
        covered,
        failed.rule_id if failed else None,
    )

    return PolicyEvaluationResult(
        covered=covered,
        rule_fired=failed.rule_id if failed else None,
        rules=rules,
        policy_id=external_policy_id,
        policy_version=policy.version if policy else None,
        config=config.model_dump(),
    )
