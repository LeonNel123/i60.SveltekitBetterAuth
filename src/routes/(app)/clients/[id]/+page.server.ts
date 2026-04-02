import { db } from '$lib/server/db';
import {
	client,
	policy,
	claim,
	task,
	document,
	note,
	activity,
	tag,
	documentTag
} from '$lib/server/db/schema';
import { logActivity } from '$lib/server/activity';
import { saveUploadedFile } from '$lib/server/files';
import { eq, and, desc, sql } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return error(403, 'No active organisation');

	const [found] = await db
		.select()
		.from(client)
		.where(and(eq(client.id, params.id), eq(client.organizationId, orgId)));
	if (!found) return error(404, 'Client not found');

	const [policies, claims, tasks, documents, notes, activities, orgTags] = await Promise.all([
		db
			.select()
			.from(policy)
			.where(and(eq(policy.clientId, params.id), eq(policy.organizationId, orgId)))
			.orderBy(desc(policy.createdAt))
			.limit(100),
		db
			.select()
			.from(claim)
			.where(and(eq(claim.clientId, params.id), eq(claim.organizationId, orgId)))
			.orderBy(desc(claim.createdAt))
			.limit(100),
		db
			.select()
			.from(task)
			.where(and(eq(task.clientId, params.id), eq(task.organizationId, orgId)))
			.orderBy(desc(task.createdAt))
			.limit(100),
		db
			.select()
			.from(document)
			.where(and(eq(document.clientId, params.id), eq(document.organizationId, orgId)))
			.orderBy(desc(document.createdAt))
			.limit(100),
		db
			.select()
			.from(note)
			.where(and(eq(note.clientId, params.id), eq(note.organizationId, orgId)))
			.orderBy(desc(note.createdAt))
			.limit(100),
		db
			.select()
			.from(activity)
			.where(and(eq(activity.clientId, params.id), eq(activity.organizationId, orgId)))
			.orderBy(desc(activity.createdAt))
			.limit(50),
		db
			.select()
			.from(tag)
			.where(sql`${tag.organizationId} = ${orgId} OR ${tag.isSystem} = true`)
	]);

	return {
		client: found,
		policies,
		claims,
		tasks,
		documents,
		notes,
		activities,
		tags: orgTags
	};
};

export const actions: Actions = {
	addNote: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { noteError: 'Not authorised.' });
		const fd = await request.formData();
		const content = (fd.get('content') as string)?.trim();
		if (!content) return fail(400, { noteError: 'Note content is required.' });

		const [created] = await db
			.insert(note)
			.values({
				organizationId: orgId,
				clientId: params.id,
				content,
				createdById: locals.user.id
			})
			.returning();

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'note',
			entityId: created.id,
			action: 'created',
			description: 'Added a note',
			performedById: locals.user.id
		});
		return { noteSuccess: true };
	},

	addPolicy: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { policyError: 'Not authorised.' });
		const fd = await request.formData();
		const policyNumber = (fd.get('policyNumber') as string)?.trim();
		const insurer = (fd.get('insurer') as string)?.trim();
		if (!policyNumber || !insurer)
			return fail(400, { policyError: 'Policy number and insurer are required.' });

		const type = (fd.get('type') as string) || 'other';
		const status = (fd.get('status') as string) || 'active';
		const startDate = (fd.get('startDate') as string) || null;
		const endDate = (fd.get('endDate') as string) || null;
		const premium = (fd.get('premium') as string) || null;

		const [created] = await db
			.insert(policy)
			.values({
				organizationId: orgId,
				clientId: params.id,
				policyNumber,
				insurer,
				type,
				status,
				startDate,
				endDate,
				premium,
				createdById: locals.user.id
			})
			.returning();

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'policy',
			entityId: created.id,
			action: 'created',
			description: `Added policy ${policyNumber} (${insurer})`,
			performedById: locals.user.id
		});
		return { policySuccess: true };
	},

	addClaim: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { claimError: 'Not authorised.' });
		const fd = await request.formData();
		const claimNumber = (fd.get('claimNumber') as string)?.trim();
		if (!claimNumber) return fail(400, { claimError: 'Claim number is required.' });

		const policyId = (fd.get('policyId') as string) || null;
		const status = (fd.get('status') as string) || 'open';
		const description = (fd.get('description') as string)?.trim() || null;
		const dateOfLoss = (fd.get('dateOfLoss') as string) || null;
		const amountClaimed = (fd.get('amountClaimed') as string) || null;

		const [created] = await db
			.insert(claim)
			.values({
				organizationId: orgId,
				clientId: params.id,
				policyId,
				claimNumber,
				status,
				description,
				dateOfLoss,
				amountClaimed,
				createdById: locals.user.id
			})
			.returning();

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'claim',
			entityId: created.id,
			action: 'created',
			description: `Opened claim ${claimNumber}`,
			performedById: locals.user.id
		});
		return { claimSuccess: true };
	},

	addTask: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { taskError: 'Not authorised.' });
		const fd = await request.formData();
		const title = (fd.get('title') as string)?.trim();
		if (!title) return fail(400, { taskError: 'Task title is required.' });

		const description = (fd.get('description') as string)?.trim() || null;
		const priority = (fd.get('priority') as string) || 'medium';
		const dueDate = (fd.get('dueDate') as string) || null;

		const [created] = await db
			.insert(task)
			.values({
				organizationId: orgId,
				clientId: params.id,
				title,
				description,
				priority,
				dueDate: dueDate ? new Date(dueDate) : null,
				createdById: locals.user.id
			})
			.returning();

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'task',
			entityId: created.id,
			action: 'created',
			description: `Created task "${title}"`,
			performedById: locals.user.id
		});
		return { taskSuccess: true };
	},

	uploadDocument: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { docError: 'Not authorised.' });
		const fd = await request.formData();
		const file = fd.get('file') as File;
		if (!file || file.size === 0) return fail(400, { docError: 'No file selected.' });

		const name = (fd.get('name') as string)?.trim() || file.name;
		const tagIds = fd.getAll('tagIds') as string[];

		try {
			const fileInfo = await saveUploadedFile(orgId, file);
			const [created] = await db
				.insert(document)
				.values({
					organizationId: orgId,
					clientId: params.id,
					name,
					fileName: fileInfo.fileName,
					mimeType: fileInfo.mimeType,
					size: fileInfo.size,
					storagePath: fileInfo.storagePath,
					uploadedById: locals.user.id
				})
				.returning();

			if (tagIds.length > 0) {
				await db
					.insert(documentTag)
					.values(tagIds.map((tagId) => ({ documentId: created.id, tagId })));
			}

			await logActivity({
				organizationId: orgId,
				clientId: params.id,
				entityType: 'document',
				entityId: created.id,
				action: 'uploaded',
				description: `Uploaded "${name}"`,
				performedById: locals.user.id
			});
			return { docSuccess: true };
		} catch {
			return fail(500, { docError: 'Failed to upload document.' });
		}
	}
};
