export interface AnalysisResult {
  claim_id: string;
  decision: 'APPROVE' | 'REJECT' | 'REVIEW';
  confidence_score: number;
  fraud_score: number;
  reasons: { code: string; description: string; severity: string }[];
  vision_result: Record<string, unknown>;
  ocr_result: Record<string, unknown>;
  policy_result: Record<string, unknown>;
  duplicate_detected: boolean;
  processing_time_ms: number;
  requires_human_review: boolean;
  ai_cost_usd: number;
}

export interface ClaimRow {
  id: string;
  external_claim_id: string;
  status: string;
  device_category: string | null;
  serial_number_input: string | null;
  created_at: string;
  metadata: {
    analysis_result?: AnalysisResult;
    images?: { path: string; filename: string }[];
  };
}

export interface DashboardStats {
  totalToday: number;
  autoApprovedPct: number;
  fraudDetected: number;
  avgProcessingMs: number;
  totalAiCostUsd: number;
}
