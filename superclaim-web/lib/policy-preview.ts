import type { PolicyConfig, RuleOutcome } from '@/lib/types';

export interface PolicyTestInput {
  device_category: string;
  damage_type: string;
  purchase_date: string;
  claim_date: string;
  prior_claims: number;
}

function daysBetween(a: string, b: string): number {
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

/** Client-side preview of deterministic policy rules (mirrors backend logic). */
export function previewPolicyRules(config: PolicyConfig, input: PolicyTestInput): RuleOutcome[] {
  const rules: RuleOutcome[] = [];

  const warrantyEndDays = config.warranty_months * 30;
  const daysSincePurchase = daysBetween(input.purchase_date, input.claim_date);
  rules.push({
    rule_id: 'warranty_active',
    passed: daysSincePurchase <= warrantyEndDays,
    reason:
      daysSincePurchase <= warrantyEndDays
        ? `Within ${config.warranty_months} month warranty window`
        : `Claim is ${daysSincePurchase} days after purchase (limit ~${warrantyEndDays} days)`,
  });

  const cat = input.device_category.toLowerCase();
  const coveredCats = config.covered_device_categories.map((c) => c.toLowerCase());
  rules.push({
    rule_id: 'device_covered',
    passed: coveredCats.includes(cat),
    reason: coveredCats.includes(cat)
      ? `Category "${input.device_category}" is covered`
      : `Category "${input.device_category}" is not in covered list`,
  });

  const dmg = input.damage_type.toLowerCase();
  const coveredDmg = config.covered_damage_types.map((d) => d.toLowerCase());
  rules.push({
    rule_id: 'damage_covered',
    passed: coveredDmg.some((d) => dmg.includes(d) || d.includes(dmg)),
    reason: coveredDmg.some((d) => dmg.includes(d) || d.includes(dmg))
      ? `Damage type "${input.damage_type}" is covered`
      : `Damage type "${input.damage_type}" is not covered`,
  });

  rules.push({
    rule_id: 'claim_limit',
    passed: input.prior_claims < config.max_claims_per_serial,
    reason:
      input.prior_claims < config.max_claims_per_serial
        ? `${input.prior_claims} prior claims (max ${config.max_claims_per_serial})`
        : `Serial exceeded max claims (${config.max_claims_per_serial})`,
  });

  const cooling = daysBetween(input.purchase_date, input.claim_date);
  rules.push({
    rule_id: 'cooling_period',
    passed: cooling >= config.cooling_period_days,
    reason:
      cooling >= config.cooling_period_days
        ? `Cooling period satisfied (${cooling} days)`
        : `Only ${cooling} days since purchase (need ${config.cooling_period_days})`,
  });

  return rules;
}

export function parseCsvList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinCsvList(values: string[]): string {
  return values.join(', ');
}

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  warranty_months: 12,
  covered_device_categories: ['smartphone', 'tablet', 'laptop'],
  covered_damage_types: ['screen', 'battery', 'water'],
  max_claims_per_serial: 2,
  cooling_period_days: 30,
};
