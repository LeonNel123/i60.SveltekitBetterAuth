import { db } from '$lib/server/db';
import { task, client, user, policy, claim } from '$lib/server/db/schema';
import { logActivity } from '$lib/server/activity';
import { resolveOrgMemberUserId } from '$lib/server/organization';
import { TASK_PRIORITIES, TASK_TYPES } from '$lib/types';
import { isTaskBoard, TASK_BOARDS, taskTypeLabel } from '$lib/tasks';
import { taskBoardConditions } from '$lib/server/task-boards';
import { isOneOf } from '$lib/utils';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and, desc, ne, sql, ilike, count, or } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const assignee = alias(user, 'assignee');

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) {
		return {
			tasks: [],
			filter: 'all',
			search: '',
			board: 'team-ops',
			boardStats: TASK_BOARDS.map((board) => ({ ...board, count: 0 })),
			clients: []
		};
	}

	const filter = url.searchParams.get('filter') ?? 'all';
	const search = url.searchParams.get('q')?.trim() ?? '';
	const requestedBoard = url.searchParams.get('board');
	const board = isTaskBoard(requestedBoard) ? requestedBoard : 'team-ops';

	const conditions = [
		eq(task.organizationId, orgId),
		ne(task.status, 'done'),
		...taskBoardConditions(board, locals.user?.id)
	];
	if (filter === 'mine' && locals.user) {
		conditions.push(eq(task.assignedToId, locals.user.id));
	}
	if (filter === 'overdue') {
		conditions.push(sql`${task.dueDate} < NOW()`);
	}
	if (search) {
		conditions.push(
			or(
				ilike(task.title, `%${search}%`),
				ilike(task.description, `%${search}%`),
				ilike(client.name, `%${search}%`)
			)!
		);
	}

	const where = and(...conditions);
	const boardStatsPromises = TASK_BOARDS.map(async (boardOption) => {
		const [result] = await db
			.select({ count: count() })
			.from(task)
			.where(
				and(
					eq(task.organizationId, orgId),
					ne(task.status, 'done'),
					...taskBoardConditions(boardOption.key, locals.user?.id)
				)
			);

		return { ...boardOption, count: result.count };
	});

	const [tasks, boardStats, clientOptions] = await Promise.all([
		db
			.select({
				task,
				clientName: client.name,
				assigneeName: assignee.name,
				policyNumber: policy.policyNumber,
				claimNumber: claim.claimNumber
			})
			.from(task)
			.leftJoin(client, eq(task.clientId, client.id))
			.leftJoin(assignee, eq(task.assignedToId, assignee.id))
			.leftJoin(policy, eq(task.policyId, policy.id))
			.leftJoin(claim, eq(task.claimId, claim.id))
			.where(where)
			.orderBy(
				sql`CASE ${task.priority} WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`,
				sql`CASE WHEN ${task.dueDate} IS NULL THEN 1 ELSE 0 END`,
				task.dueDate,
				desc(task.createdAt)
			)
			.limit(100),
		Promise.all(boardStatsPromises),
		db
			.select({ id: client.id, name: client.name })
			.from(client)
			.where(eq(client.organizationId, orgId))
			.orderBy(client.name)
			.limit(250)
	]);

	return {
		tasks: tasks.map((row) => ({
			...row.task,
			clientName: row.clientName,
			assigneeName: row.assigneeName,
			policyNumber: row.policyNumber,
			claimNumber: row.claimNumber
		})),
		filter,
		search,
		board,
		boardStats,
		clients: clientOptions
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const fd = await request.formData();
		const title = (fd.get('title') as string)?.trim();
		if (!title) return fail(400, { error: 'Title is required.' });

		const description = (fd.get('description') as string)?.trim() || null;
		const priority = (fd.get('priority') as string) || 'medium';
		if (!isOneOf(priority, TASK_PRIORITIES)) {
			return fail(400, { error: 'Invalid task priority.' });
		}

		const taskType = (fd.get('taskType') as string) || 'general';
		if (!isOneOf(taskType, TASK_TYPES)) {
			return fail(400, { error: 'Invalid task type.' });
		}

		const dueDate = (fd.get('dueDate') as string) || null;
		const requestedAssignee = (fd.get('assignedToId') as string)?.trim() || '';
		const assignedToId =
			requestedAssignee === 'unassigned'
				? null
				: ((await resolveOrgMemberUserId(orgId, requestedAssignee || locals.user.id)) ?? null);
		if (requestedAssignee && requestedAssignee !== 'unassigned' && !assignedToId) {
			return fail(400, { error: 'Selected assignee is invalid.' });
		}

		const requestedClientId = (fd.get('clientId') as string)?.trim() || null;
		let clientId: string | null = null;
		if (requestedClientId) {
			const [existingClient] = await db
				.select({ id: client.id })
				.from(client)
				.where(and(eq(client.id, requestedClientId), eq(client.organizationId, orgId)));

			if (!existingClient) {
				return fail(400, { error: 'Selected client is invalid.' });
			}

			clientId = existingClient.id;
		}

		const [created] = await db
			.insert(task)
			.values({
				organizationId: orgId,
				title,
				description,
				taskType,
				priority,
				dueDate: dueDate ? new Date(dueDate) : null,
				createdById: locals.user.id,
				assignedToId,
				clientId
			})
			.returning({ id: task.id, clientId: task.clientId });

		await logActivity({
			organizationId: orgId,
			clientId,
			entityType: 'task',
			entityId: created.id,
			action: 'created',
			description: `Created ${taskTypeLabel(taskType).toLowerCase()} task "${title}"`,
			performedById: locals.user.id,
			metadata: { taskType, assignedToId }
		});

		return { success: true };
	}
};
