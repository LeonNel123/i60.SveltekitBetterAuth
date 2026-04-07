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
import {
	buildClaimWorkflowKey,
	buildRenewalWorkflowKey,
	completeWorkflowTask,
	syncClaimTask,
	syncRenewalTask
} from '$lib/server/task-workflows';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { filterVisibleTagIds, resolveOrgMemberUserId } from '$lib/server/organization';
import {
	CLAIM_STATUSES,
	POLICY_STATUSES,
	POLICY_TYPES,
	TASK_PRIORITIES,
	TASK_TYPES
} from '$lib/types';
import { taskTypeLabel } from '$lib/tasks';
import { isOneOf } from '$lib/utils';
import type { PageServerLoad, Actions } from './$types';

const assignee = alias(user, 'assignee');

async function findClientPolicy(orgId: string, clientId: string, policyId: string) {
	const [existingPolicy] = await db
		.select()
		.from(policy)
		.where(
			and(eq(policy.id, policyId), eq(policy.clientId, clientId), eq(policy.organizationId, orgId))
		);

	return existingPolicy;
}

async function findClientClaim(orgId: string, clientId: string, claimId: string) {
	const [existingClaim] = await db
		.select()
		.from(claim)
		.where(
			and(eq(claim.id, claimId), eq(claim.clientId, clientId), eq(claim.organizationId, orgId))
		);

	return existingClaim;
}

async function findClientNote(orgId: string, clientId: string, noteId: string) {
	const [existingNote] = await db
		.select()
		.from(note)
		.where(and(eq(note.id, noteId), eq(note.clientId, clientId), eq(note.organizationId, orgId)));

	return existingNote;
}

function noteToTaskTitle(content: string): string {
	const firstLine =
		content
			.split('\n')
			.map((line) => line.trim())
			.find(Boolean) ?? 'Follow up on note';
	return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
}

async function findClientDocument(orgId: string, clientId: string, documentId: string) {
	const [existingDocument] = await db
		.select()
		.from(document)
		.where(
			and(
				eq(document.id, documentId),
				eq(document.clientId, clientId),
				eq(document.organizationId, orgId)
			)
		);

	return existingDocument;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return error(403, 'No active organisation');

	const creator = alias(user, 'creator');
	const [found] = await db
		.select({ client: client, createdByName: creator.name })
		.from(client)
		.leftJoin(creator, eq(client.createdById, creator.id))
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
			.select({
				task: task,
				assigneeName: assignee.name,
				policyNumber: policy.policyNumber,
				claimNumber: claim.claimNumber
			})
			.from(task)
			.leftJoin(assignee, eq(task.assignedToId, assignee.id))
			.leftJoin(policy, eq(task.policyId, policy.id))
			.leftJoin(claim, eq(task.claimId, claim.id))
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

	// Load tags for each document
	const docIds = documents.map((d) => d.id);
	const docTagMap: Record<string, { id: string; name: string; isSystem: boolean }[]> = {};

	if (docIds.length > 0) {
		const docTags = await db
			.select({
				documentId: documentTag.documentId,
				tagId: tag.id,
				tagName: tag.name,
				isSystem: tag.isSystem
			})
			.from(documentTag)
			.innerJoin(tag, eq(documentTag.tagId, tag.id))
			.where(inArray(documentTag.documentId, docIds));

		for (const dt of docTags) {
			if (!docTagMap[dt.documentId]) docTagMap[dt.documentId] = [];
			docTagMap[dt.documentId].push({ id: dt.tagId, name: dt.tagName, isSystem: dt.isSystem });
		}
	}

	return {
		client: { ...found.client, createdByName: found.createdByName },
		policies,
		claims,
		tasks: tasks.map((r) => ({
			...r.task,
			assigneeName: r.assigneeName,
			policyNumber: r.policyNumber,
			claimNumber: r.claimNumber
		})),
		documents: documents.map((d) => ({ ...d, tags: docTagMap[d.id] ?? [] })),
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

		const existingNote = await findClientNote(orgId, params.id, noteId);
		if (!existingNote) return fail(404, { noteError: 'Note not found.' });

		await db
			.update(note)
			.set({ content, updatedAt: new Date() })
			.where(
				and(eq(note.id, noteId), eq(note.clientId, params.id), eq(note.organizationId, orgId))
			);

		return { noteSuccess: true };
	},

	deleteNote: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { noteError: 'Not authorised.' });

		const fd = await request.formData();
		const noteId = fd.get('noteId') as string;
		if (!noteId) return fail(400, { noteError: 'Note ID is required.' });

		const existingNote = await findClientNote(orgId, params.id, noteId);
		if (!existingNote) return fail(404, { noteError: 'Note not found.' });

		await db
			.delete(note)
			.where(
				and(eq(note.id, noteId), eq(note.clientId, params.id), eq(note.organizationId, orgId))
			);

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'note',
			entityId: noteId,
			action: 'deleted',
			description: 'Deleted a note',
			performedById: locals.user.id
		});

		return { noteSuccess: true };
	},

	promoteNote: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { noteError: 'Not authorised.' });

		const fd = await request.formData();
		const noteId = fd.get('noteId') as string;
		if (!noteId) return fail(400, { noteError: 'Note ID is required.' });

		const existingNote = await findClientNote(orgId, params.id, noteId);
		if (!existingNote) return fail(404, { noteError: 'Note not found.' });

		const title = noteToTaskTitle(existingNote.content);
		const [createdTask] = await db
			.insert(task)
			.values({
				organizationId: orgId,
				clientId: params.id,
				title,
				description: existingNote.content,
				taskType: 'general',
				priority: 'medium',
				createdById: locals.user.id,
				assignedToId: locals.user.id
			})
			.returning({ id: task.id });

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'task',
			entityId: createdTask.id,
			action: 'created',
			description: `Promoted note to task "${title}"`,
			performedById: locals.user.id,
			metadata: { noteId }
		});

		return { noteSuccess: true, promotedTaskId: createdTask.id };
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
		if (!isOneOf(type, POLICY_TYPES)) return fail(400, { policyError: 'Invalid policy type.' });
		if (!isOneOf(status, POLICY_STATUSES))
			return fail(400, { policyError: 'Invalid policy status.' });

		const startDate = (fd.get('startDate') as string) || null;
		const endDate = (fd.get('endDate') as string) || null;
		const premium = (fd.get('premium') as string) || null;
		const isActivePrimary = fd.get('isActivePrimary') === 'on';

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
				isActivePrimary,
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

		await syncRenewalTask({
			orgId,
			clientId: params.id,
			policyId: created.id,
			policyNumber,
			insurer,
			policyStatus: status,
			endDate,
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

		const existing = await findClientPolicy(orgId, params.id, policyId);
		if (!existing) return fail(404, { policyError: 'Policy not found.' });

		const policyNumber = (fd.get('policyNumber') as string)?.trim();
		const insurer = (fd.get('insurer') as string)?.trim();
		if (!policyNumber || !insurer)
			return fail(400, { policyError: 'Policy number and insurer are required.' });

		const type = (fd.get('type') as string) || 'other';
		const status = (fd.get('status') as string) || 'active';
		if (!isOneOf(type, POLICY_TYPES)) return fail(400, { policyError: 'Invalid policy type.' });
		if (!isOneOf(status, POLICY_STATUSES))
			return fail(400, { policyError: 'Invalid policy status.' });

		const startDate = (fd.get('startDate') as string) || null;
		const endDate = (fd.get('endDate') as string) || null;
		const premium = (fd.get('premium') as string) || null;
		const isActivePrimary = fd.get('isActivePrimary') === 'on';

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
				isActivePrimary,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(policy.id, policyId),
					eq(policy.clientId, params.id),
					eq(policy.organizationId, orgId)
				)
			);

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'policy',
			entityId: policyId,
			action: 'updated',
			description: `Updated policy ${policyNumber} (${insurer})`,
			performedById: locals.user.id
		});

		await syncRenewalTask({
			orgId,
			clientId: params.id,
			policyId,
			policyNumber,
			insurer,
			policyStatus: status,
			endDate,
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

		const existing = await findClientPolicy(orgId, params.id, policyId);
		if (!existing) return fail(404, { policyError: 'Policy not found.' });

		await db
			.delete(policy)
			.where(
				and(
					eq(policy.id, policyId),
					eq(policy.clientId, params.id),
					eq(policy.organizationId, orgId)
				)
			);

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'policy',
			entityId: policyId,
			action: 'deleted',
			description: `Deleted policy ${existing.policyNumber} (${existing.insurer})`,
			performedById: locals.user.id
		});

		await completeWorkflowTask({
			orgId,
			workflowKey: buildRenewalWorkflowKey(policyId),
			clientId: params.id,
			description: `System completed renewal task for deleted policy ${existing.policyNumber}`,
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

		const requestedPolicyId = (fd.get('policyId') as string)?.trim() || null;
		const status = (fd.get('status') as string) || 'open';
		if (!isOneOf(status, CLAIM_STATUSES)) return fail(400, { claimError: 'Invalid claim status.' });

		const linkedPolicy = requestedPolicyId
			? await findClientPolicy(orgId, params.id, requestedPolicyId)
			: null;
		if (requestedPolicyId && !linkedPolicy) {
			return fail(400, { claimError: 'Selected policy is invalid.' });
		}

		const description = (fd.get('description') as string)?.trim() || null;
		const dateOfLoss = (fd.get('dateOfLoss') as string) || null;
		const amountClaimed = (fd.get('amountClaimed') as string) || null;
		const amountSettled = (fd.get('amountSettled') as string) || null;

		const [created] = await db
			.insert(claim)
			.values({
				organizationId: orgId,
				clientId: params.id,
				policyId: linkedPolicy?.id ?? null,
				claimNumber,
				status,
				description,
				dateOfLoss,
				amountClaimed,
				amountSettled,
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

		await syncClaimTask({
			orgId,
			clientId: params.id,
			claimId: created.id,
			claimNumber,
			policyId: linkedPolicy?.id ?? null,
			claimStatus: status,
			description,
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

		const existing = await findClientClaim(orgId, params.id, claimId);
		if (!existing) return fail(404, { claimError: 'Claim not found.' });

		const claimNumber = (fd.get('claimNumber') as string)?.trim();
		if (!claimNumber) return fail(400, { claimError: 'Claim number is required.' });

		const requestedPolicyId = (fd.get('policyId') as string)?.trim() || null;
		const status = (fd.get('status') as string) || 'open';
		if (!isOneOf(status, CLAIM_STATUSES)) return fail(400, { claimError: 'Invalid claim status.' });

		const linkedPolicy = requestedPolicyId
			? await findClientPolicy(orgId, params.id, requestedPolicyId)
			: null;
		if (requestedPolicyId && !linkedPolicy) {
			return fail(400, { claimError: 'Selected policy is invalid.' });
		}

		const description = (fd.get('description') as string)?.trim() || null;
		const dateOfLoss = (fd.get('dateOfLoss') as string) || null;
		const amountClaimed = (fd.get('amountClaimed') as string) || null;
		const amountSettled = (fd.get('amountSettled') as string) || null;

		await db
			.update(claim)
			.set({
				claimNumber,
				policyId: linkedPolicy?.id ?? null,
				status,
				description,
				dateOfLoss,
				amountClaimed,
				amountSettled,
				updatedAt: new Date()
			})
			.where(
				and(eq(claim.id, claimId), eq(claim.clientId, params.id), eq(claim.organizationId, orgId))
			);

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'claim',
			entityId: claimId,
			action: 'updated',
			description: `Updated claim ${claimNumber}`,
			performedById: locals.user.id
		});

		await syncClaimTask({
			orgId,
			clientId: params.id,
			claimId,
			claimNumber,
			policyId: linkedPolicy?.id ?? null,
			claimStatus: status,
			description,
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

		const existing = await findClientClaim(orgId, params.id, claimId);
		if (!existing) return fail(404, { claimError: 'Claim not found.' });

		await db
			.delete(claim)
			.where(
				and(eq(claim.id, claimId), eq(claim.clientId, params.id), eq(claim.organizationId, orgId))
			);

		await logActivity({
			organizationId: orgId,
			clientId: params.id,
			entityType: 'claim',
			entityId: claimId,
			action: 'deleted',
			description: `Deleted claim ${existing.claimNumber}`,
			performedById: locals.user.id
		});

		await completeWorkflowTask({
			orgId,
			workflowKey: buildClaimWorkflowKey(claimId),
			clientId: params.id,
			description: `System completed claim task for deleted claim ${existing.claimNumber}`,
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
		if (!isOneOf(priority, TASK_PRIORITIES))
			return fail(400, { taskError: 'Invalid task priority.' });

		const requestedPolicyId = (fd.get('policyId') as string)?.trim() || null;
		const linkedPolicy = requestedPolicyId
			? await findClientPolicy(orgId, params.id, requestedPolicyId)
			: null;
		if (requestedPolicyId && !linkedPolicy) {
			return fail(400, { taskError: 'Selected policy is invalid.' });
		}

		const requestedClaimId = (fd.get('claimId') as string)?.trim() || null;
		const linkedClaim = requestedClaimId
			? await findClientClaim(orgId, params.id, requestedClaimId)
			: null;
		if (requestedClaimId && !linkedClaim) {
			return fail(400, { taskError: 'Selected claim is invalid.' });
		}

		if (
			linkedPolicy &&
			linkedClaim &&
			linkedClaim.policyId &&
			linkedClaim.policyId !== linkedPolicy.id
		) {
			return fail(400, { taskError: 'Selected claim does not match the selected policy.' });
		}

		const requestedTaskType = (fd.get('taskType') as string) || 'general';
		let taskType = requestedTaskType;
		if (requestedTaskType === 'general' && linkedClaim) taskType = 'claim';
		else if (requestedTaskType === 'general' && linkedPolicy) taskType = 'renewal';
		if (!isOneOf(taskType, TASK_TYPES)) {
			return fail(400, { taskError: 'Invalid task type.' });
		}

		const dueDate = (fd.get('dueDate') as string) || null;
		const requestedAssignee = (fd.get('assignedToId') as string)?.trim() || '';
		const assignedToId =
			requestedAssignee === 'unassigned'
				? null
				: ((await resolveOrgMemberUserId(orgId, requestedAssignee || locals.user.id)) ?? null);
		if (requestedAssignee && requestedAssignee !== 'unassigned' && !assignedToId) {
			return fail(400, { taskError: 'Selected assignee is invalid.' });
		}

		const [created] = await db
			.insert(task)
			.values({
				organizationId: orgId,
				clientId: params.id,
				policyId: linkedPolicy?.id ?? linkedClaim?.policyId ?? null,
				claimId: linkedClaim?.id ?? null,
				title,
				description,
				taskType,
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
			description: `Created ${taskTypeLabel(taskType).toLowerCase()} task "${title}"`,
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
		const requestedTagIds = Array.from(
			new Set((fd.getAll('tagIds') as string[]).map((tagId) => tagId.trim()).filter(Boolean))
		);
		const tagIds = await filterVisibleTagIds(orgId, requestedTagIds);
		if (tagIds.length !== requestedTagIds.length) {
			return fail(400, { docError: 'One or more selected tags are invalid.' });
		}

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

		const existing = await findClientDocument(orgId, params.id, documentId);
		if (!existing) return fail(404, { docError: 'Document not found.' });

		// Delete tags first, then document record, then file from disk
		await db.delete(documentTag).where(eq(documentTag.documentId, documentId));
		await db
			.delete(document)
			.where(
				and(
					eq(document.id, documentId),
					eq(document.clientId, params.id),
					eq(document.organizationId, orgId)
				)
			);
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

		throw redirect(303, '/clients');
	}
};
