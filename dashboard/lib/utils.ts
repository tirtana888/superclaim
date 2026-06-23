import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
  }).format(value);
}

export function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case 'approved':
    case 'APPROVE':
      return 'badge-approve';
    case 'rejected':
    case 'REJECT':
      return 'badge-reject';
    case 'review':
    case 'REVIEW':
      return 'badge-review';
    default:
      return 'badge-processing';
  }
}
