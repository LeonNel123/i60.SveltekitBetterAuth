/**
 * Shared formatting utilities for dates, currency, time, and file sizes.
 */

export function formatDate(d: string | Date | null | undefined): string {
	if (!d) return '\u2014';
	const date = typeof d === 'string' ? new Date(d) : d;
	return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatCurrency(v: string | number | null | undefined): string {
	if (v == null || v === '') return '\u2014';
	const num = typeof v === 'string' ? parseFloat(v) : v;
	if (isNaN(num)) return '\u2014';
	return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(num);
}

export function timeAgo(d: string | Date | null | undefined): string {
	if (!d) return '';
	const date = typeof d === 'string' ? new Date(d) : d;
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return formatDate(d);
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function policyTypeLabel(t: string): string {
	const labels: Record<string, string> = {
		motor: 'Motor',
		property: 'Property',
		liability: 'Liability',
		commercial: 'Commercial',
		life: 'Life',
		other: 'Other'
	};
	return labels[t] ?? t;
}

export function claimStatusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
	const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		open: 'default',
		in_progress: 'default',
		settled: 'secondary',
		rejected: 'destructive',
		closed: 'outline'
	};
	return map[s] ?? 'outline';
}

export function claimStatusLabel(s: string): string {
	const labels: Record<string, string> = {
		open: 'Open',
		in_progress: 'In Progress',
		settled: 'Settled',
		rejected: 'Rejected',
		closed: 'Closed'
	};
	return labels[s] ?? s;
}

export function policyStatusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
	const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		active: 'default',
		pending: 'outline',
		lapsed: 'destructive',
		cancelled: 'secondary'
	};
	return map[s] ?? 'outline';
}

export function policyStatusLabel(s: string): string {
	const labels: Record<string, string> = {
		active: 'Active',
		pending: 'Pending',
		lapsed: 'Lapsed',
		cancelled: 'Cancelled'
	};
	return labels[s] ?? s;
}
