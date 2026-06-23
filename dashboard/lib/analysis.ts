import type { AnalysisResult } from '@/lib/types';

export interface PolicyRuleRow {
  rule_id: string;
  passed: boolean;
  reason: string;
}

export function getPolicyRules(analysis: AnalysisResult): PolicyRuleRow[] {
  const rules = analysis.policy_result?.rules;
  if (!Array.isArray(rules)) return [];
  return rules.filter(
    (rule): rule is PolicyRuleRow =>
      typeof rule === 'object' &&
      rule !== null &&
      'rule_id' in rule &&
      'passed' in rule &&
      'reason' in rule,
  );
}

export function getVisionSummary(analysis: AnalysisResult) {
  const v = analysis.vision_result;
  if (!v || Object.keys(v).length === 0) return null;
  return {
    damageType: String(v.damage_type ?? 'unknown'),
    severity: String(v.damage_severity ?? 'unknown'),
    device: String(v.device_identified ?? 'unknown'),
    confidence:
      typeof v.confidence === 'number' ? v.confidence : Number(v.confidence ?? 0),
  };
}

export function getOcrSummary(analysis: AnalysisResult) {
  const o = analysis.ocr_result;
  if (!o || Object.keys(o).length === 0) return null;
  const serials = Array.isArray(o.serial_numbers_found)
    ? (o.serial_numbers_found as string[])
    : [];
  return {
    serials,
    bestMatch: o.best_match ? String(o.best_match) : null,
    matchWithInput:
      typeof o.match_with_input === 'boolean' ? o.match_with_input : null,
    confidence:
      typeof o.confidence === 'number' ? o.confidence : Number(o.confidence ?? 0),
  };
}

export function decisionHeadline(decision: AnalysisResult['decision']): string {
  switch (decision) {
    case 'REJECT':
      return 'Klaim ditolak otomatis';
    case 'APPROVE':
      return 'Klaim disetujui otomatis';
    case 'REVIEW':
      return 'Klaim perlu review manual';
    default:
      return 'Hasil analisis';
  }
}

export function reasonSeverityClass(severity: string): string {
  switch (severity) {
    case 'high':
      return 'text-red-400';
    case 'medium':
      return 'text-amber-400';
    default:
      return 'text-emerald-400';
  }
}
