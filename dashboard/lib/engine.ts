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
  serial_number_input?: string;
  purchase_date?: string;
  claim_date?: string;
  damage_description?: string;
  policy_id?: string;
  images: {
    filename: string;
    content_base64: string;
    content_type: string;
  }[];
  metadata?: Record<string, unknown>;
}

export async function submitClaimToEngine(payload: SubmitClaimPayload) {
  if (!API_KEY || !TENANT_ID) {
    throw new Error('SUPERCLAIM_API_KEY or SUPERCLAIM_TENANT_ID not configured');
  }

  const res = await fetch(`${ENGINE_URL}/v1/claims/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Tenant-ID': TENANT_ID,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  if (!res.ok) {
    const message =
      typeof body.detail === 'object'
        ? body.detail.message ?? JSON.stringify(body.detail)
        : body.detail ?? body.message ?? 'Submit failed';
    throw new Error(message);
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
