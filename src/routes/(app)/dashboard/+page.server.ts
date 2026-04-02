import { db } from '$lib/server/db';
import { client, task, policy, claim, activity, user } from '$lib/server/db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and, ne, sql, desc, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const assignee = alias(user, 'assignee');

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) {
		return {
			stats: { clients: 0, activePolicies: 0, openClaims: 0, pendingTasks: 0, urgentRenewals: 0 },
			myTasks: [],
			overdueTasks: [],
			recentTasks: [],
			renewingSoon: [],
			recentActivity: []
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
		recentTasks,
		renewingSoon,
		urgentRenewalCount,
		recentActivity
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
			? db.select({ task: task, clientName: client.name, assigneeName: assignee.name })
				.from(task).leftJoin(client, eq(task.clientId, client.id)).leftJoin(assignee, eq(task.assignedToId, assignee.id))
				.where(and(eq(task.organizationId, orgId), eq(task.assignedToId, userId), ne(task.status, 'done')))
				.orderBy(sql`CASE ${task.priority} WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`, desc(task.createdAt))
				.limit(10)
			: Promise.resolve([]),
		db.select({ task: task, clientName: client.name, assigneeName: assignee.name })
			.from(task).leftJoin(client, eq(task.clientId, client.id)).leftJoin(assignee, eq(task.assignedToId, assignee.id))
			.where(and(eq(task.organizationId, orgId), ne(task.status, 'done'), sql`${task.dueDate} < NOW()`))
			.orderBy(task.dueDate).limit(10),
		db.select({ task: task, clientName: client.name, assigneeName: assignee.name })
			.from(task).leftJoin(client, eq(task.clientId, client.id)).leftJoin(assignee, eq(task.assignedToId, assignee.id))
			.where(eq(task.organizationId, orgId))
			.orderBy(desc(task.createdAt)).limit(5),
		// Policies expiring within 30 days
		db.select({
			policy: policy,
			clientName: client.name,
			clientId: client.id
		})
		.from(policy)
		.innerJoin(client, eq(policy.clientId, client.id))
		.where(and(
			eq(policy.organizationId, orgId),
			eq(policy.status, 'active'),
			sql`${policy.endDate} IS NOT NULL`,
			sql`${policy.endDate} <= (CURRENT_DATE + INTERVAL '30 days')`,
			sql`${policy.endDate} >= CURRENT_DATE`
		))
		.orderBy(policy.endDate)
		.limit(10),
		db.select({ count: count() }).from(policy).where(
			and(
				eq(policy.organizationId, orgId),
				eq(policy.status, 'active'),
				sql`${policy.endDate} IS NOT NULL`,
				sql`${policy.endDate} <= (CURRENT_DATE + INTERVAL '7 days')`,
				sql`${policy.endDate} >= CURRENT_DATE`
			)
		),
		db.select().from(activity)
			.where(eq(activity.organizationId, orgId))
			.orderBy(desc(activity.createdAt))
			.limit(15)
	]);

	return {
		stats: {
			clients: clientCount[0].count,
			activePolicies: activePolicyCount[0].count,
			openClaims: openClaimCount[0].count,
			pendingTasks: pendingTaskCount[0].count,
			urgentRenewals: urgentRenewalCount[0].count
		},
		myTasks: myTasks.map((r) => ({ ...r.task, clientName: r.clientName, assigneeName: r.assigneeName })),
		overdueTasks: overdueTasks.map((r) => ({ ...r.task, clientName: r.clientName, assigneeName: r.assigneeName })),
		recentTasks: recentTasks.map((r) => ({ ...r.task, clientName: r.clientName, assigneeName: r.assigneeName })),
		renewingSoon: renewingSoon.map((r) => ({ ...r.policy, clientName: r.clientName, clientId: r.clientId })),
		recentActivity
	};
};
