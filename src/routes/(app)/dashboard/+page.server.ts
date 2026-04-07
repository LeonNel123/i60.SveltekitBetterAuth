import { db } from '$lib/server/db';
import { client, task, policy, claim, activity, user } from '$lib/server/db/schema';
import { TASK_BOARDS, isTaskBoard } from '$lib/tasks';
import { taskBoardConditions, taskBoardWhere } from '$lib/server/task-boards';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and, ne, sql, desc, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const assignee = alias(user, 'assignee');

export const load: PageServerLoad = async ({ locals, url }) => {
	const requestedBoard = url.searchParams.get('board');
	const board = isTaskBoard(requestedBoard) ? requestedBoard : 'my-queue';

	if (!locals.session?.activeOrganizationId) {
		return {
			board,
			stats: { clients: 0, activePolicies: 0, openClaims: 0, pendingTasks: 0, urgentRenewals: 0 },
			boardStats: TASK_BOARDS.map((item) => ({ ...item, count: 0 })),
			boardTasks: [],
			overdueTasks: [],
			renewingSoon: [],
			recentActivity: [],
			workload: []
		};
	}

	const orgId = locals.session.activeOrganizationId;
	const userId = locals.user?.id;
	const boardStatsPromises = TASK_BOARDS.map(async (boardOption) => {
		const [result] = await db
			.select({ count: count() })
			.from(task)
			.where(taskBoardWhere(orgId, boardOption.key, userId));

		return { ...boardOption, count: result.count };
	});

	const [
		clientCount,
		activePolicyCount,
		openClaimCount,
		pendingTaskCount,
		boardStats,
		boardTasks,
		overdueTasks,
		renewingSoon,
		urgentRenewalCount,
		recentActivity,
		workload
	] = await Promise.all([
		db.select({ count: count() }).from(client).where(eq(client.organizationId, orgId)),
		db
			.select({ count: count() })
			.from(policy)
			.where(and(eq(policy.organizationId, orgId), eq(policy.status, 'active'))),
		db
			.select({ count: count() })
			.from(claim)
			.where(and(eq(claim.organizationId, orgId), sql`${claim.status} IN ('open', 'in_progress')`)),
		db
			.select({ count: count() })
			.from(task)
			.where(and(eq(task.organizationId, orgId), ne(task.status, 'done'))),
		Promise.all(boardStatsPromises),
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
			.where(taskBoardWhere(orgId, board, userId))
			.orderBy(
				sql`CASE ${task.priority} WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`,
				sql`CASE WHEN ${task.dueDate} IS NULL THEN 1 ELSE 0 END`,
				task.dueDate,
				desc(task.createdAt)
			)
			.limit(12),
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
			.where(
				and(eq(task.organizationId, orgId), ne(task.status, 'done'), sql`${task.dueDate} < NOW()`)
			)
			.orderBy(task.dueDate)
			.limit(8),
		db
			.select({
				policy,
				clientName: client.name,
				clientId: client.id
			})
			.from(policy)
			.innerJoin(client, eq(policy.clientId, client.id))
			.where(
				and(
					eq(policy.organizationId, orgId),
					eq(policy.status, 'active'),
					sql`${policy.endDate} IS NOT NULL`,
					sql`${policy.endDate} <= (CURRENT_DATE + INTERVAL '30 days')`,
					sql`${policy.endDate} >= CURRENT_DATE`
				)
			)
			.orderBy(policy.endDate)
			.limit(10),
		db
			.select({ count: count() })
			.from(policy)
			.where(
				and(
					eq(policy.organizationId, orgId),
					eq(policy.status, 'active'),
					sql`${policy.endDate} IS NOT NULL`,
					sql`${policy.endDate} <= (CURRENT_DATE + INTERVAL '7 days')`,
					sql`${policy.endDate} >= CURRENT_DATE`
				)
			),
		db
			.select()
			.from(activity)
			.where(eq(activity.organizationId, orgId))
			.orderBy(desc(activity.createdAt))
			.limit(15),
		db
			.select({
				assignedToId: task.assignedToId,
				assigneeName: assignee.name,
				openTasks: count()
			})
			.from(task)
			.leftJoin(assignee, eq(task.assignedToId, assignee.id))
			.where(and(eq(task.organizationId, orgId), ne(task.status, 'done')))
			.groupBy(task.assignedToId, assignee.name)
	]);

	return {
		board,
		stats: {
			clients: clientCount[0].count,
			activePolicies: activePolicyCount[0].count,
			openClaims: openClaimCount[0].count,
			pendingTasks: pendingTaskCount[0].count,
			urgentRenewals: urgentRenewalCount[0].count
		},
		boardStats,
		boardTasks: boardTasks.map((row) => ({
			...row.task,
			clientName: row.clientName,
			assigneeName: row.assigneeName,
			policyNumber: row.policyNumber,
			claimNumber: row.claimNumber
		})),
		overdueTasks: overdueTasks.map((row) => ({
			...row.task,
			clientName: row.clientName,
			assigneeName: row.assigneeName,
			policyNumber: row.policyNumber,
			claimNumber: row.claimNumber
		})),
		renewingSoon: renewingSoon.map((row) => ({
			...row.policy,
			clientName: row.clientName,
			clientId: row.clientId
		})),
		recentActivity,
		workload: workload
			.map((entry) => ({
				assignedToId: entry.assignedToId,
				assigneeName: entry.assigneeName ?? 'Unassigned',
				openTasks: entry.openTasks
			}))
			.sort((left, right) => right.openTasks - left.openTasks)
	};
};
