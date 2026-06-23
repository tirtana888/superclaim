import type { AnalysisResult, ClaimRow } from '@/lib/types';

function normalizeEngineUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:8000';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const ENGINE_URL = normalizeEngineUrl(process.env.SUPERCLAIM_API_URL || 'http://localhost:8000');
const API_KEY = process.env.SUPERCLAIM_API_KEY || '';
const TENANT_ID = process.env.SUPERCLAIM_TENANT_ID || '';

export function getEngineUrl() {
  return ENGINE_URL;
}

export interface SubmitClaimPayload {
  claim_id: string;
  device_category: string;
  serial_number_input: string;
  purchase_date: string;
  claim_date: string;
  damage_description: string;
  policy_id?: string;
  images: {
    filename: string;
    content_base64: string;
    content_type: string;
  }[];
  metadata?: Record<string, unknown>;
}

async function parseEngineResponse(res: Response) {
  const text = await res.text();
  if (!text) return { body: null as unknown, raw: '' };
  try {
    return { body: JSON.parse(text) as unknown, raw: text };
  } catch {
    return { body: null as unknown, raw: text };
  }
}

function extractErrorMessage(body: unknown, raw: string, status: number): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const detail = record.detail;
    if (typeof detail === 'object' && detail !== null) {
      const detailRecord = detail as Record<string, unknown>;
      if (typeof detailRecord.message === 'string') return detailRecord.message;
      return JSON.stringify(detail);
    }
    if (typeof detail === 'string') return detail;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }
  if (raw) return raw.slice(0, 300);
  return `Engine request failed (${status})`;
}

export async function submitClaimToEngine(payload: SubmitClaimPayload) {
  if (!API_KEY || !TENANT_ID) {
    throw new Error('SUPERCLAIM_API_KEY or SUPERCLAIM_TENANT_ID not configured');
  }

  let res: Response;
  try {
    res = await fetch(`${ENGINE_URL}/v1/claims/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Tidak bisa hubungi engine API (${ENGINE_URL}): ${msg}`);
  }

  const { body, raw } = await parseEngineResponse(res);
  if (!res.ok) {
    throw new Error(`[${res.status}] ${extractErrorMessage(body, raw, res.status)}`);
  }
  return body;
}

export async function checkEngineHealth() {
  try {
    const res = await fetch(`${ENGINE_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const DECISION_STATUS: Record<string, string> = {
  APPROVE: 'approved',
  REJECT: 'rejected',
  REVIEW: 'review',
};

export async function fetchClaimResultFromEngine(claimId: string) {
  if (!API_KEY || !TENANT_ID) {
    return { status: 'error' as const, message: 'Engine credentials not configured' };
  }

  let res: Response;
  try {
    res = await fetch(`${ENGINE_URL}/v1/claims/${encodeURIComponent(claimId)}`, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Tenant-ID': TENANT_ID,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { status: 'error' as const, message: msg };
  }

  const { body, raw } = await parseEngineResponse(res);
  if (res.status === 409) {
    return { status: 'processing' as const };
  }
  if (!res.ok) {
    return {
      status: 'error' as const,
      message: extractErrorMessage(body, raw, res.status),
    };
  }
  return { status: 'done' as const, analysis: body as AnalysisResult };
}

export function mergeEngineAnalysis(
  claim: ClaimRow,
  analysis: AnalysisResult,
): ClaimRow {
  return {
    ...claim,
    status: DECISION_STATUS[analysis.decision] ?? claim.status,
    metadata: {
      ...claim.metadata,
      analysis_result: analysis,
    },
  };
}
