import { db } from '$lib/server/db';
import { task, client, policy, claim } from '$lib/server/db/schema';
import { logActivity } from '$lib/server/activity';
import { resolveOrgMemberUserId } from '$lib/server/organization';
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from '$lib/types';
import { taskTypeLabel } from '$lib/tasks';
import { isOneOf } from '$lib/utils';
import { eq, and } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return error(403, 'No active organisation');

	const [result] = await db
		.select({
			task,
			clientName: client.name,
			policyNumber: policy.policyNumber,
			claimNumber: claim.claimNumber
		})
		.from(task)
		.leftJoin(client, eq(task.clientId, client.id))
		.leftJoin(policy, eq(task.policyId, policy.id))
		.leftJoin(claim, eq(task.claimId, claim.id))
		.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));

	if (!result) return error(404, 'Task not found');
	return {
		task: {
			...result.task,
			clientName: result.clientName,
			policyNumber: result.policyNumber,
			claimNumber: result.claimNumber
		}
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const fd = await request.formData();
		const status = fd.get('status') as string;
		if (!isOneOf(status, TASK_STATUSES)) return fail(400, { error: 'Invalid task status.' });

		const [existing] = await db
			.select({ clientId: task.clientId, title: task.title })
			.from(task)
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));
		if (!existing) return fail(404, { error: 'Task not found.' });

		const updates: Record<string, unknown> = { status, updatedAt: new Date() };
		if (status === 'done') updates.completedAt = new Date();
		else updates.completedAt = null;

		await db
			.update(task)
			.set(updates)
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));

		await logActivity({
			organizationId: orgId,
			clientId: existing.clientId,
			entityType: 'task',
			entityId: params.id,
			action: status === 'done' ? 'completed' : 'status_changed',
			description:
				status === 'done'
					? `Completed task "${existing.title}"`
					: `Task status changed to "${status}"`,
			performedById: locals.user.id
		});
		return { success: true };
	},

	update: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const [existing] = await db
			.select({ clientId: task.clientId, title: task.title })
			.from(task)
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));
		if (!existing) return fail(404, { error: 'Task not found.' });

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

		await db
			.update(task)
			.set({
				title,
				description,
				taskType,
				priority,
				dueDate: dueDate ? new Date(dueDate) : null,
				updatedAt: new Date()
			})
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));

		await logActivity({
			organizationId: orgId,
			clientId: existing.clientId,
			entityType: 'task',
			entityId: params.id,
			action: 'updated',
			description: `Updated ${taskTypeLabel(taskType).toLowerCase()} task "${title}"`,
			performedById: locals.user.id
		});

		return { success: true };
	},

	assign: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const [existing] = await db
			.select({ clientId: task.clientId, title: task.title })
			.from(task)
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));
		if (!existing) return fail(404, { error: 'Task not found.' });

		const fd = await request.formData();
		const requestedAssigneeId = (fd.get('assignedToId') as string)?.trim() || null;
		const assignedToId =
			requestedAssigneeId === 'unassigned'
				? null
				: requestedAssigneeId
					? await resolveOrgMemberUserId(orgId, requestedAssigneeId)
					: null;
		if (requestedAssigneeId && requestedAssigneeId !== 'unassigned' && !assignedToId) {
			return fail(400, { error: 'Selected assignee is invalid.' });
		}

		await db
			.update(task)
			.set({ assignedToId, updatedAt: new Date() })
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));

		await logActivity({
			organizationId: orgId,
			clientId: existing.clientId,
			entityType: 'task',
			entityId: params.id,
			action: 'updated',
			description: assignedToId
				? `Reassigned task "${existing.title}"`
				: `Moved task "${existing.title}" to triage`,
			performedById: locals.user.id
		});

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const [existing] = await db
			.select({ title: task.title, clientId: task.clientId })
			.from(task)
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));
		if (!existing) return fail(404, { error: 'Task not found.' });

		await db.delete(task).where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));

		await logActivity({
			organizationId: orgId,
			clientId: existing.clientId,
			entityType: 'task',
			entityId: params.id,
			action: 'deleted',
			description: `Deleted task "${existing.title}"`,
			performedById: locals.user.id
		});

		throw redirect(303, '/tasks');
	}
};
