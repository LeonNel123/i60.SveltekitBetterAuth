import { db } from '$lib/server/db';
import { task, client } from '$lib/server/db/schema';
import { logActivity } from '$lib/server/activity';
import { eq, and } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return error(403, 'No active organisation');

	const [result] = await db
		.select({ task: task, clientName: client.name })
		.from(task)
		.leftJoin(client, eq(task.clientId, client.id))
		.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));

	if (!result) return error(404, 'Task not found');
	return { task: { ...result.task, clientName: result.clientName } };
};

export const actions: Actions = {
	updateStatus: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const fd = await request.formData();
		const status = fd.get('status') as string;

		const updates: Record<string, unknown> = { status, updatedAt: new Date() };
		if (status === 'done') updates.completedAt = new Date();
		else updates.completedAt = null;

		await db
			.update(task)
			.set(updates)
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));

		await logActivity({
			organizationId: orgId,
			clientId: null,
			entityType: 'task',
			entityId: params.id,
			action: 'status_changed',
			description: `Task status changed to "${status}"`,
			performedById: locals.user.id
		});
		return { success: true };
	},

	update: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const fd = await request.formData();
		const title = (fd.get('title') as string)?.trim();
		if (!title) return fail(400, { error: 'Title is required.' });

		const description = (fd.get('description') as string)?.trim() || null;
		const priority = (fd.get('priority') as string) || 'medium';
		const dueDate = (fd.get('dueDate') as string) || null;
		const assignedToId = (fd.get('assignedToId') as string)?.trim() || null;

		await db
			.update(task)
			.set({
				title,
				description,
				priority,
				assignedToId,
				dueDate: dueDate ? new Date(dueDate) : null,
				updatedAt: new Date()
			})
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));
		return { success: true };
	},

	assign: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const fd = await request.formData();
		const assignedToId = (fd.get('assignedToId') as string) || null;

		await db
			.update(task)
			.set({ assignedToId, updatedAt: new Date() })
			.where(and(eq(task.id, params.id), eq(task.organizationId, orgId)));

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
