const ACCESS_COOKIE = 'sc_access_token';
const REFRESH_COOKIE = 'sc_refresh_token';

export function getApiBase(): string {
  const raw = (process.env.SUPERCLAIM_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
