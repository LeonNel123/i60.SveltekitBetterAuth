export const CLIENT_TYPES = ['individual', 'company'] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const POLICY_TYPES = [
	'motor',
	'property',
	'liability',
	'commercial',
	'life',
	'other'
] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export const POLICY_STATUSES = ['active', 'lapsed', 'cancelled', 'pending'] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

export const CLAIM_STATUSES = ['open', 'in_progress', 'settled', 'rejected', 'closed'] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_TYPES = [
	'general',
	'renewal',
	'claim',
	'document',
	'compliance',
	'internal'
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const ACTIVITY_ACTIONS = [
	'created',
	'updated',
	'deleted',
	'completed',
	'uploaded',
	'status_changed'
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ENTITY_TYPES = ['client', 'policy', 'claim', 'task', 'document', 'note'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const SYSTEM_TAGS = [
	'policy-schedule',
	'renewal',
	'claim-document',
	'kyc',
	'inspection',
	'bank-letter',
	'endorsement',
	'certificate',
	'invoice',
	'correspondence'
] as const;
