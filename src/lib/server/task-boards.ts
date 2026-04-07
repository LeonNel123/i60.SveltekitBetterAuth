import { task } from '$lib/server/db/schema';
import type { TaskBoardKey } from '$lib/tasks';
import { and, eq, isNull, ne, or, sql, type SQL } from 'drizzle-orm';

export function openTaskConditions(orgId: string): SQL[] {
	return [eq(task.organizationId, orgId), ne(task.status, 'done')];
}

export function taskBoardConditions(board: TaskBoardKey, userId?: string | null): SQL[] {
	switch (board) {
		case 'my-queue':
			return userId ? [eq(task.assignedToId, userId)] : [sql`1 = 0`];
		case 'team-ops':
			return [];
		case 'renewals':
			return [or(eq(task.taskType, 'renewal'), sql`${task.policyId} IS NOT NULL`)!];
		case 'claims':
			return [or(eq(task.taskType, 'claim'), sql`${task.claimId} IS NOT NULL`)!];
		case 'outstanding-docs':
			return [sql`${task.taskType} IN ('document', 'compliance')`];
		case 'triage':
			return [isNull(task.assignedToId)];
	}
}

export function taskBoardWhere(orgId: string, board: TaskBoardKey, userId?: string | null) {
	return and(...openTaskConditions(orgId), ...taskBoardConditions(board, userId));
}
