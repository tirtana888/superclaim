import type { ApiErrorBody } from '@/lib/types';

export function getApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as ApiErrorBody).detail;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object' && 'message' in detail) {
      return String(detail.message ?? fallback);
    }
  }
  return fallback;
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; token?: string | null };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${getApiBase()}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const parsed = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(parsed, `Request failed (${res.status})`), parsed as ApiErrorBody);
  }
  return parsed as T;
}

/** Browser: call Next.js BFF routes that attach cookies server-side. */
export async function bffRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  const res = await fetch(path, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const parsed = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(parsed, `Request failed (${res.status})`), parsed as ApiErrorBody);
  }
  return parsed as T;
}
