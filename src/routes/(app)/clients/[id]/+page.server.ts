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
	documentTag,
	user
} from '$lib/server/db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { logActivity } from '$lib/server/activity';
import { saveUploadedFile, deleteFile } from '$lib/server/files';
import { eq, and, desc, sql } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const assignee = alias(user, 'assignee');

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
			.select({ task: task, assigneeName: assignee.name })
			.from(task)
			.leftJoin(assignee, eq(task.assignedToId, assignee.id))
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
		tasks: tasks.map((r) => ({ ...r.task, assigneeName: r.assigneeName })),
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

	editNote: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { noteError: 'Not authorised.' });

		const fd = await request.formData();
		const noteId = fd.get('noteId') as string;
		const content = (fd.get('content') as string)?.trim();
		if (!noteId || !content) return fail(400, { noteError: 'Note content is required.' });

		await db.update(note).set({ content, updatedAt: new Date() })
			.where(and(eq(note.id, noteId), eq(note.organizationId, orgId)));

		return { noteSuccess: true };
	},

	deleteNote: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { noteError: 'Not authorised.' });

		const fd = await request.formData();
		const noteId = fd.get('noteId') as string;
		if (!noteId) return fail(400, { noteError: 'Note ID is required.' });

		await db.delete(note).where(and(eq(note.id, noteId), eq(note.organizationId, orgId)));

		await logActivity({
			organizationId: orgId, clientId: params.id, entityType: 'note',
			entityId: noteId, action: 'deleted', description: 'Deleted a note',
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

	editPolicy: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { policyError: 'Not authorised.' });
		const fd = await request.formData();
		const policyId = (fd.get('policyId') as string)?.trim();
		if (!policyId) return fail(400, { policyError: 'Policy ID is required.' });

		// Verify the policy belongs to this org
		const [existing] = await db
			.select()
			.from(policy)
			.where(and(eq(policy.id, policyId), eq(policy.organizationId, orgId)));
		if (!existing) return fail(404, { policyError: 'Policy not found.' });

		const policyNumber = (fd.get('policyNumber') as string)?.trim();
		const insurer = (fd.get('insurer') as string)?.trim();
		if (!policyNumber || !insurer)
			return fail(400, { policyError: 'Policy number and insurer are required.' });

		const type = (fd.get('type') as string) || 'other';
		const status = (fd.get('status') as string) || 'active';
		const startDate = (fd.get('startDate') as string) || null;
		const endDate = (fd.get('endDate') as string) || null;
		const premium = (fd.get('premium') as string) || null;

		await db
			.update(policy)
			.set({
				policyNumber,
				insurer,
				type,
				status,
				startDate,
				endDate,
				premium,
				updatedAt: new Date()
			})
			.where(eq(policy.id, policyId));

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'policy',
			entityId: policyId,
			action: 'updated',
			description: `Updated policy ${policyNumber} (${insurer})`,
			performedById: locals.user.id
		});
		return { policySuccess: true };
	},

	deletePolicy: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { policyError: 'Not authorised.' });
		const fd = await request.formData();
		const policyId = (fd.get('policyId') as string)?.trim();
		if (!policyId) return fail(400, { policyError: 'Policy ID is required.' });

		// Verify the policy belongs to this org
		const [existing] = await db
			.select()
			.from(policy)
			.where(and(eq(policy.id, policyId), eq(policy.organizationId, orgId)));
		if (!existing) return fail(404, { policyError: 'Policy not found.' });

		await db.delete(policy).where(eq(policy.id, policyId));

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'policy',
			entityId: policyId,
			action: 'deleted',
			description: `Deleted policy ${existing.policyNumber} (${existing.insurer})`,
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

	editClaim: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { claimError: 'Not authorised.' });
		const fd = await request.formData();
		const claimId = (fd.get('claimId') as string)?.trim();
		if (!claimId) return fail(400, { claimError: 'Claim ID is required.' });

		// Verify the claim belongs to this org
		const [existing] = await db
			.select()
			.from(claim)
			.where(and(eq(claim.id, claimId), eq(claim.organizationId, orgId)));
		if (!existing) return fail(404, { claimError: 'Claim not found.' });

		const claimNumber = (fd.get('claimNumber') as string)?.trim();
		if (!claimNumber) return fail(400, { claimError: 'Claim number is required.' });

		const status = (fd.get('status') as string) || 'open';
		const description = (fd.get('description') as string)?.trim() || null;
		const dateOfLoss = (fd.get('dateOfLoss') as string) || null;
		const amountClaimed = (fd.get('amountClaimed') as string) || null;
		const amountSettled = (fd.get('amountSettled') as string) || null;

		await db
			.update(claim)
			.set({
				claimNumber,
				status,
				description,
				dateOfLoss,
				amountClaimed,
				amountSettled,
				updatedAt: new Date()
			})
			.where(eq(claim.id, claimId));

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'claim',
			entityId: claimId,
			action: 'updated',
			description: `Updated claim ${claimNumber}`,
			performedById: locals.user.id
		});
		return { claimSuccess: true };
	},

	deleteClaim: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { claimError: 'Not authorised.' });
		const fd = await request.formData();
		const claimId = (fd.get('claimId') as string)?.trim();
		if (!claimId) return fail(400, { claimError: 'Claim ID is required.' });

		// Verify the claim belongs to this org
		const [existing] = await db
			.select()
			.from(claim)
			.where(and(eq(claim.id, claimId), eq(claim.organizationId, orgId)));
		if (!existing) return fail(404, { claimError: 'Claim not found.' });

		await db.delete(claim).where(eq(claim.id, claimId));

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'claim',
			entityId: claimId,
			action: 'deleted',
			description: `Deleted claim ${existing.claimNumber}`,
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
		const assignedToId = (fd.get('assignedToId') as string) || locals.user.id;

		const [created] = await db
			.insert(task)
			.values({
				organizationId: orgId,
				clientId: params.id,
				title,
				description,
				priority,
				dueDate: dueDate ? new Date(dueDate) : null,
				createdById: locals.user.id,
				assignedToId
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
	},

	deleteDocument: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { docError: 'Not authorised.' });
		const fd = await request.formData();
		const documentId = (fd.get('documentId') as string)?.trim();
		if (!documentId) return fail(400, { docError: 'Document ID is required.' });

		// Verify the document belongs to this org
		const [existing] = await db
			.select()
			.from(document)
			.where(and(eq(document.id, documentId), eq(document.organizationId, orgId)));
		if (!existing) return fail(404, { docError: 'Document not found.' });

		// Delete tags first, then document record, then file from disk
		await db.delete(documentTag).where(eq(documentTag.documentId, documentId));
		await db.delete(document).where(eq(document.id, documentId));
		await deleteFile(existing.storagePath);

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'document',
			entityId: documentId,
			action: 'deleted',
			description: `Deleted document "${existing.name}"`,
			performedById: locals.user.id
		});
		return { docSuccess: true };
	},

	deleteClient: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });
		const fd = await request.formData();
		const confirm = (fd.get('confirm') as string)?.trim();
		if (confirm !== 'yes') return fail(400, { error: 'Deletion not confirmed.' });

		// Verify the client belongs to this org
		const [existing] = await db
			.select()
			.from(client)
			.where(and(eq(client.id, params.id), eq(client.organizationId, orgId)));
		if (!existing) return fail(404, { error: 'Client not found.' });

		// Delete associated documents' files from disk before cascade deletes records
		const docs = await db
			.select({ storagePath: document.storagePath })
			.from(document)
			.where(and(eq(document.clientId, params.id), eq(document.organizationId, orgId)));
		for (const d of docs) {
			await deleteFile(d.storagePath);
		}

		// Delete the client — FK cascades handle policies, claims, notes, documents, tasks
		await db.delete(client).where(eq(client.id, params.id));

		await logActivity({
			organizationId: orgId,
			entityType: 'client',
			entityId: params.id,
			action: 'deleted',
			description: `Deleted client "${existing.name}"`,
			performedById: locals.user.id
		});

		redirect(303, '/clients');
	}
};
