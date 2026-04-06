import { db } from '$lib/server/db';
import { task, client, user } from '$lib/server/db/schema';
import { resolveOrgMemberUserId } from '$lib/server/organization';
import { TASK_PRIORITIES } from '$lib/types';
import { isOneOf } from '$lib/utils';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and, desc, ne, sql, ilike } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const assignee = alias(user, 'assignee');

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return { tasks: [], filter: 'all', search: '' };

	const filter = url.searchParams.get('filter') ?? 'all';
	const search = url.searchParams.get('q')?.trim() ?? '';

	const conditions = [eq(task.organizationId, orgId)];
	if (filter === 'mine' && locals.user) {
		conditions.push(eq(task.assignedToId, locals.user.id));
	}
	if (filter === 'overdue') {
		conditions.push(sql`${task.dueDate} < NOW()`);
		conditions.push(ne(task.status, 'done'));
	}
	if (search) {
		conditions.push(ilike(task.title, `%${search}%`));
	}

	const where = conditions.length === 1 ? conditions[0] : and(...conditions);

	const tasks = await db
		.select({ task: task, clientName: client.name, assigneeName: assignee.name })
		.from(task)
		.leftJoin(client, eq(task.clientId, client.id))
		.leftJoin(assignee, eq(task.assignedToId, assignee.id))
		.where(where)
		.orderBy(
			sql`CASE ${task.priority} WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`,
			desc(task.createdAt)
		)
		.limit(100);

	return {
		tasks: tasks.map((r) => ({
			...r.task,
			clientName: r.clientName,
			assigneeName: r.assigneeName
		})),
		filter,
		search
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

		const dueDate = (fd.get('dueDate') as string) || null;
		const assignedToId =
			(await resolveOrgMemberUserId(
				orgId,
				(fd.get('assignedToId') as string)?.trim() || locals.user.id
			)) ?? null;
		if (!assignedToId) return fail(400, { error: 'Selected assignee is invalid.' });

		await db.insert(task).values({
			organizationId: orgId,
			title,
			description,
			priority,
			dueDate: dueDate ? new Date(dueDate) : null,
			createdById: locals.user.id,
			assignedToId
		});
		return { success: true };
	}
};
