export type UserRole = 'ADMIN' | 'DEALER' | 'USER';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  created_at: string;
  updated_at: string;
}

export interface Dealer {
  id: string;
  profile_id: string;
  business_name: string;
  business_address?: string | null;
  contact_person?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_holder?: string | null;
  commission_rate: number;
  commission_schedule: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
  plans?: Plan[];
}

export interface Plan {
  id: string;
  product_id: string;
  name: string;
  price: number;
  duration_months: number;
  coverage_types: ('physical_damage' | 'water_damage' | 'loss' | 'short_circuit')[];
  max_claims: number;
  max_claim_value_pct: number;
  cooldown_days: number;
  commission_rate: number;
  kyc_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Policy {
  id: string;
  policy_number: string;
  plan_id: string;
  dealer_id?: string | null;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  device_category: string;
  device_brand: string;
  device_model: string;
  serial_number: string;
  purchase_date: string;
  purchase_price: number;
  start_date: string;
  end_date: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  payment_ref?: string | null;
  payment_channel?: string | null;
  paid_at?: string | null;
  certificate_url?: string | null;
  created_at: string;
  updated_at: string;
  plan?: Plan;
  dealer?: Dealer;
}

export type ClaimStatus = 
  | 'SUBMITTED' 
  | 'KYC_PENDING' 
  | 'UNDER_REVIEW' 
  | 'DOCS_REQUESTED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'PAYOUT_PROCESSING' 
  | 'COMPLETED';

export type KYCStatus = 'NOT_REQUIRED' | 'PENDING' | 'PASSED' | 'FAILED';

export interface Claim {
  id: string;
  claim_ref: string;
  policy_id: string;
  user_id: string;
  incident_type: 'physical_damage' | 'water_damage' | 'loss' | 'short_circuit';
  incident_date: string;
  incident_location: string;
  description: string;
  claimed_amount: number;
  approved_amount?: number | null;
  deductible_amount: number; // 5% mandatory platform deductible
  net_payout?: number | null; // approved_amount - deductible_amount
  status: ClaimStatus;
  kyc_status: KYCStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  policy?: Policy;
  documents?: ClaimDocument[];
  milestones?: ClaimMilestone[];
}

export interface ClaimDocument {
  id: string;
  claim_id: string;
  document_type: 'PHOTO' | 'VIDEO' | 'INVOICE' | 'KTP' | 'POLICE_REPORT' | 'OTHER';
  storage_path: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  uploaded_at: string;
}

export interface ClaimMilestone {
  id: string;
  claim_id: string;
  stage: number; // 1 to 7
  stage_name: string;
  stage_name_id: string;
  note?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Commission {
  id: string;
  dealer_id: string;
  policy_id: string;
  amount: number;
  rate: number;
  status: 'PENDING' | 'DISBURSED' | 'CANCELLED';
  disbursement_date?: string | null;
  period_batch?: string | null;
  created_at: string;
  updated_at: string;
  policy?: Policy;
  dealer?: Dealer;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'IN_APP';
  is_read: boolean;
  sent_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  changes_json?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface KYCRecord {
  id: string;
  claim_id: string;
  user_id: string;
  provider: 'verihubs' | 'privy' | 'sumsub';
  status: 'PENDING' | 'PASSED' | 'FAILED';
  provider_ref?: string | null;
  confidence_score?: number | null;
  verified_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface GlobalSettings {
  key: string;
  value: Record<string, any>;
  updated_at: string;
}
