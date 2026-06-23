export const ACCESS_COOKIE = 'sc_access_token';
export const REFRESH_COOKIE = 'sc_refresh_token';

export function canManageSettings(role: string | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function canReviewClaims(role: string | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'reviewer';
}
