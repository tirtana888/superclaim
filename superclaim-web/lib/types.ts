/** Mirror backend Pydantic schemas — snake_case from API. */

export type UserRole = 'owner' | 'admin' | 'reviewer';
export type PolicyStatus = 'draft' | 'active' | 'archived';
export type ClaimDecision = 'APPROVE' | 'REJECT' | 'REVIEW';

export interface Tenant {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_tier: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  status: string;
  created_at?: string | null;
}

export interface PlatformAdmin {
  id: string;
  email: string;
  status: string;
  created_at?: string | null;
}

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  status: string;
  onboarding_bonus_override?: number | null;
  revenue_rate_override?: number | null;
  created_at?: string | null;
}

export interface SalesRepCreated extends SalesRep {
  temporary_password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface AuthResponse {
  user: User | null;
  platform_admin: PlatformAdmin | null;
  sales_rep: SalesRep | null;
  tenant: Tenant | null;
  tokens: TokenResponse;
}

export interface MeResponse {
  user: User | null;
  platform_admin: PlatformAdmin | null;
  sales_rep: SalesRep | null;
  tenant: Tenant | null;
}

// ---- Sales dashboard ----

export interface Dealer {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_tier: string;
  is_active: boolean;
  onboarded_at?: string | null;
  claims_processed_total: number;
  last_claim_at?: string | null;
  revenue_current_period: number;
}

export interface DealerListResponse {
  dealers: Dealer[];
}

export interface RevenuePoint {
  period: string;
  claims_processed: number;
  revenue: number;
}

export interface DealerDetail extends Dealer {
  revenue_history: RevenuePoint[];
}

export interface DealerOnboardCreated {
  tenant_id: string;
  tenant_name: string;
  slug: string | null;
  owner_email: string;
  temporary_password: string;
  onboarding_bonus_awarded: number;
}

export interface DealerCommissionBreakdown {
  tenant_id: string;
  tenant_name: string;
  claims_processed: number;
  revenue: number;
  revenue_commission: number;
  onboarding_bonus: number;
}

export type CommissionRange = 'week' | 'month';

export interface CommissionSummary {
  range: CommissionRange;
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_revenue_commission: number;
  total_onboarding_bonus: number;
  total_commission: number;
  dealers: DealerCommissionBreakdown[];
}

export interface CommissionSettings {
  default_onboarding_bonus: number;
  default_revenue_rate: number;
  updated_at?: string | null;
}

export interface TenantAdmin {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_tier: string;
  is_active: boolean;
  user_count: number;
  claim_count: number;
  created_at?: string | null;
}

export interface TenantUserAdmin {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  status: string;
  created_at?: string | null;
}

export interface PlatformStats {
  tenant_count: number;
  active_tenant_count: number;
  user_count: number;
  claim_count: number;
}

export interface PolicyConfig {
  warranty_months: number;
  covered_device_categories: string[];
  covered_damage_types: string[];
  max_claims_per_serial: number;
  cooling_period_days: number;
}

export interface Policy {
  id: string;
  tenant_id: string;
  external_policy_id: string;
  name: string;
  version: number;
  status: PolicyStatus;
  is_active: boolean;
  rules_json: PolicyConfig | Record<string, unknown>;
  effective_from?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PolicyListResponse {
  policies: Policy[];
  total: number;
}

export interface Device {
  id: string;
  tenant_id: string;
  serial_number: string;
  device_category: string;
  device_model?: string | null;
  purchase_date?: string | null;
  warranty_months?: number | null;
  customer_ref?: string | null;
  batch_id?: string | null;
  source: string;
  created_at?: string | null;
}

export interface DeviceListResponse {
  devices: Device[];
  total: number;
}

export interface ApiCredential {
  id: string;
  tenant_id: string;
  key_id: string;
  label: string | null;
  scopes: string[];
  status: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
}

export interface ApiCredentialCreated extends ApiCredential {
  secret: string;
}

export interface ApiCredentialListResponse {
  credentials: ApiCredential[];
  total: number;
}

export interface TeamMember {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  status: string;
  created_at?: string | null;
}

export interface TeamListResponse {
  members: TeamMember[];
  total: number;
}

export interface RuleOutcome {
  rule_id: string;
  passed: boolean;
  reason: string;
}

export interface TeamInviteCreated extends User {
  temporary_password: string;
}

export interface UsageRecord {
  id: string;
  tenant_id: string;
  period: string;
  claims_processed: number;
  ai_cost_total: number;
  billable_amount: number;
  created_at?: string | null;
}

export interface ClaimSummary {
  id: string;
  external_claim_id: string;
  status: string;
  device_category?: string | null;
  serial_number_input?: string | null;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ClaimListResponse {
  claims: ClaimSummary[];
}

export interface ClaimDecisionResult {
  claim_id: string;
  decision: ClaimDecision;
  confidence_score: number;
  fraud_score: number;
  reasons: ReasonItem[];
  vision_result?: Record<string, unknown>;
  ocr_result?: Record<string, unknown>;
  policy_result?: Record<string, unknown>;
  duplicate_detected?: boolean;
  processing_time_ms?: number;
  requires_human_review?: boolean;
  ai_cost_usd?: number;
}

export interface VisionResult {
  damage_type: string;
  damage_severity: 'none' | 'minor' | 'moderate' | 'severe';
  device_identified?: string | null;
  confidence: number;
  ai_cost_usd: number;
}

export interface OCRResult {
  serial_numbers_found: string[];
  best_match?: string | null;
  matches_input: boolean;
  confidence: number;
  ai_cost_usd: number;
}

export interface RuleOutcome {
  rule_id: string;
  passed: boolean;
  reason: string;
}

export interface PolicyResult {
  covered: boolean;
  rules: RuleOutcome[];
  policy_version: number;
}

export interface FraudResult {
  fraud_score: number;
  risk_level: 'low' | 'medium' | 'high';
  feature_contributions: Record<string, number>;
}

export interface ReasonItem {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ClaimAnalysisResult {
  claim_id: string;
  decision: ClaimDecision;
  confidence_score: number;
  fraud_score: number;
  requires_human_review: boolean;
  reasons: ReasonItem[];
  vision_result?: VisionResult | null;
  ocr_result?: OCRResult | null;
  policy_result?: PolicyResult | null;
  duplicate_result?: Record<string, unknown> | null;
  ai_cost_usd: number;
  processing_time_ms: number;
}

export interface ApiErrorDetail {
  error_code?: string;
  message?: string;
  detail?: unknown;
}

export interface ApiErrorBody {
  detail?: ApiErrorDetail | string;
}
