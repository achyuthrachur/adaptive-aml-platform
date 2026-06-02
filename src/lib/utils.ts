import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getRiskColor(score: number): string {
  if (score < 40) return '#05AB8C';
  if (score <= 70) return '#F5A800';
  return '#E5376B';
}

export function getRiskLabel(score: number): string {
  if (score < 40) return 'Low';
  if (score <= 70) return 'Medium';
  return 'High';
}

export function getTopFeature(features: Record<string, number>): string {
  const entries = Object.entries(features);
  entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  return entries[0]?.[0] ?? '';
}

export const FEATURE_LABELS: Record<string, string> = {
  amount_vs_baseline: 'Amount vs Baseline',
  corridor_familiarity: 'Corridor Familiarity',
  peer_group_deviation: 'Peer Group Deviation',
  counterparty_risk: 'Counterparty Risk',
  velocity_last_7d: 'Velocity (7d)',
  transaction_type_shift: 'Tx Type Shift',
};

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  amount_vs_baseline: "Transaction amount relative to customer's 90-day average",
  corridor_familiarity: "Whether this jurisdiction appears in customer's baseline activity",
  peer_group_deviation: 'How this activity compares to similar customers',
  counterparty_risk: 'Pre-assigned risk flag on this counterparty',
  velocity_last_7d: 'Transaction frequency over the past 7 days vs baseline',
  transaction_type_shift: "Whether this transaction type is unusual for this customer",
};
