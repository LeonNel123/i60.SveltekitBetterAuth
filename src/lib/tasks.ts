import { type TaskType } from '$lib/types';

export const TASK_BOARD_KEYS = [
	'my-queue',
	'team-ops',
	'renewals',
	'claims',
	'outstanding-docs',
	'triage'
] as const;

export type TaskBoardKey = (typeof TASK_BOARD_KEYS)[number];

export const TASK_BOARDS: {
	key: TaskBoardKey;
	label: string;
	description: string;
}[] = [
	{
		key: 'my-queue',
		label: 'My Queue',
		description: 'Assigned work that still needs your attention.'
	},
	{
		key: 'team-ops',
		label: 'Team Ops',
		description: 'All open operational work across the organisation.'
	},
	{
		key: 'renewals',
		label: 'Renewals',
		description: 'Renewal-driven tasks and policy follow-ups.'
	},
	{
		key: 'claims',
		label: 'Claims',
		description: 'Claim-related work that is currently in flight.'
	},
	{
		key: 'outstanding-docs',
		label: 'Outstanding Docs',
		description: 'Document collection, compliance, and missing-information follow-ups.'
	},
	{
		key: 'triage',
		label: 'Unassigned / Triage',
		description: 'Open work that has not yet been properly assigned.'
	}
];

export function isTaskBoard(value: string | null | undefined): value is TaskBoardKey {
	return !!value && TASK_BOARD_KEYS.includes(value as TaskBoardKey);
}

export function taskTypeLabel(taskType: TaskType | string): string {
	const labels: Record<string, string> = {
		general: 'General',
		renewal: 'Renewal',
		claim: 'Claim',
		document: 'Document',
		compliance: 'Compliance',
		internal: 'Internal'
	};

	return labels[taskType] ?? taskType;
}

export function taskBoardLabel(board: TaskBoardKey): string {
	return TASK_BOARDS.find((candidate) => candidate.key === board)?.label ?? board;
}

export function taskBoardDescription(board: TaskBoardKey): string {
	return TASK_BOARDS.find((candidate) => candidate.key === board)?.description ?? '';
}
