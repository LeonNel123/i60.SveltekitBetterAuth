import { db } from '$lib/server/db';
import { client, task, policy, claim } from '$lib/server/db/schema';
import { eq, and, ne, sql, desc, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) {
		return {
			stats: { clients: 0, activePolicies: 0, openClaims: 0, pendingTasks: 0 },
			myTasks: [],
			overdueTasks: [],
			recentTasks: []
		};
	}

	const userId = locals.user?.id;

	const [
		clientCount,
		activePolicyCount,
		openClaimCount,
		pendingTaskCount,
		myTasks,
		overdueTasks,
		recentTasks
	] = await Promise.all([
		db.select({ count: count() }).from(client).where(eq(client.organizationId, orgId)),
		db.select({ count: count() }).from(policy).where(
			and(eq(policy.organizationId, orgId), eq(policy.status, 'active'))
		),
		db.select({ count: count() }).from(claim).where(
			and(eq(claim.organizationId, orgId), sql`${claim.status} IN ('open', 'in_progress')`)
		),
		db.select({ count: count() }).from(task).where(
			and(eq(task.organizationId, orgId), ne(task.status, 'done'))
		),
		userId
			? db.select({ task: task, clientName: client.name })
				.from(task).leftJoin(client, eq(task.clientId, client.id))
				.where(and(eq(task.organizationId, orgId), eq(task.assignedToId, userId), ne(task.status, 'done')))
				.orderBy(sql`CASE ${task.priority} WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`, desc(task.createdAt))
				.limit(10)
			: Promise.resolve([]),
		db.select({ task: task, clientName: client.name })
			.from(task).leftJoin(client, eq(task.clientId, client.id))
			.where(and(eq(task.organizationId, orgId), ne(task.status, 'done'), sql`${task.dueDate} < NOW()`))
			.orderBy(task.dueDate).limit(10),
		db.select({ task: task, clientName: client.name })
			.from(task).leftJoin(client, eq(task.clientId, client.id))
			.where(eq(task.organizationId, orgId))
			.orderBy(desc(task.createdAt)).limit(5)
	]);

	return {
		stats: {
			clients: clientCount[0].count,
			activePolicies: activePolicyCount[0].count,
			openClaims: openClaimCount[0].count,
			pendingTasks: pendingTaskCount[0].count
		},
		myTasks: myTasks.map((r) => ({ ...r.task, clientName: r.clientName })),
		overdueTasks: overdueTasks.map((r) => ({ ...r.task, clientName: r.clientName })),
		recentTasks: recentTasks.map((r) => ({ ...r.task, clientName: r.clientName }))
	};
};
