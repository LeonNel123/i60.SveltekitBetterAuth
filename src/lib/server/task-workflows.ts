import { db } from '$lib/server/db';
import { task } from '$lib/server/db/schema';
import { logActivity } from '$lib/server/activity';
import { and, eq } from 'drizzle-orm';

const RENEWAL_WINDOW_DAYS = 30;

function renewalWorkflowKey(policyId: string) {
	return `renewal:${policyId}`;
}

function claimWorkflowKey(claimId: string) {
	return `claim:${claimId}`;
}

function daysUntil(dateValue: string | Date | null | undefined): number {
	if (!dateValue) return Infinity;

	const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date(dateValue.getTime());
	if (Number.isNaN(date.getTime())) return Infinity;

	date.setHours(0, 0, 0, 0);

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function renewalPriority(days: number) {
	if (days <= 7) return 'urgent';
	if (days <= 14) return 'high';
	return 'medium';
}

async function getWorkflowTask(orgId: string, workflowKey: string) {
	const [existing] = await db
		.select()
		.from(task)
		.where(and(eq(task.organizationId, orgId), eq(task.workflowKey, workflowKey)));

	return existing;
}

export async function syncRenewalTask(params: {
	orgId: string;
	clientId: string;
	policyId: string;
	policyNumber: string;
	insurer: string;
	policyStatus: string;
	endDate: string | null;
	performedById: string;
}) {
	const workflowKey = renewalWorkflowKey(params.policyId);
	const existing = await getWorkflowTask(params.orgId, workflowKey);

	const days = daysUntil(params.endDate);
	const shouldBeOpen =
		params.policyStatus === 'active' && params.endDate !== null && days <= RENEWAL_WINDOW_DAYS;

	if (!shouldBeOpen) {
		if (!existing || existing.status === 'done') return;

		await db
			.update(task)
			.set({
				status: 'done',
				completedAt: existing.completedAt ?? new Date(),
				updatedAt: new Date()
			})
			.where(eq(task.id, existing.id));

		await logActivity({
			organizationId: params.orgId,
			clientId: params.clientId,
			entityType: 'task',
			entityId: existing.id,
			action: 'completed',
			description: `System completed renewal task for policy ${params.policyNumber}`,
			performedById: params.performedById,
			metadata: { workflowKey }
		});
		return;
	}

	const title = `Renewal review for policy ${params.policyNumber}`;
	const description = `Policy ${params.policyNumber} with ${params.insurer} renews on ${params.endDate}.`;
	const priority = renewalPriority(days);

	if (!existing) {
		const [created] = await db
			.insert(task)
			.values({
				organizationId: params.orgId,
				clientId: params.clientId,
				policyId: params.policyId,
				title,
				description,
				taskType: 'renewal',
				workflowKey,
				priority,
				dueDate: new Date(params.endDate!),
				createdById: params.performedById,
				assignedToId: null
			})
			.returning({ id: task.id });

		await logActivity({
			organizationId: params.orgId,
			clientId: params.clientId,
			entityType: 'task',
			entityId: created.id,
			action: 'created',
			description: `System created renewal task for policy ${params.policyNumber}`,
			performedById: params.performedById,
			metadata: { workflowKey }
		});
		return;
	}

	const wasDone = existing.status === 'done';
	await db
		.update(task)
		.set({
			clientId: params.clientId,
			policyId: params.policyId,
			title,
			description,
			taskType: 'renewal',
			priority,
			dueDate: new Date(params.endDate!),
			status: wasDone ? 'todo' : existing.status,
			completedAt: wasDone ? null : existing.completedAt,
			updatedAt: new Date()
		})
		.where(eq(task.id, existing.id));

	if (wasDone) {
		await logActivity({
			organizationId: params.orgId,
			clientId: params.clientId,
			entityType: 'task',
			entityId: existing.id,
			action: 'status_changed',
			description: `System reopened renewal task for policy ${params.policyNumber}`,
			performedById: params.performedById,
			metadata: { workflowKey }
		});
	}
}

export async function syncClaimTask(params: {
	orgId: string;
	clientId: string;
	claimId: string;
	claimNumber: string;
	policyId: string | null;
	claimStatus: string;
	description: string | null;
	performedById: string;
}) {
	const workflowKey = claimWorkflowKey(params.claimId);
	const existing = await getWorkflowTask(params.orgId, workflowKey);
	const shouldBeOpen = params.claimStatus === 'open' || params.claimStatus === 'in_progress';
	const title = `Claim ${params.claimNumber} follow-up`;
	const description =
		params.description?.trim() || `Track updates and next actions for claim ${params.claimNumber}.`;

	if (!shouldBeOpen) {
		if (!existing || existing.status === 'done') return;

		await db
			.update(task)
			.set({
				status: 'done',
				completedAt: existing.completedAt ?? new Date(),
				updatedAt: new Date()
			})
			.where(eq(task.id, existing.id));

		await logActivity({
			organizationId: params.orgId,
			clientId: params.clientId,
			entityType: 'task',
			entityId: existing.id,
			action: 'completed',
			description: `System completed claim task for claim ${params.claimNumber}`,
			performedById: params.performedById,
			metadata: { workflowKey }
		});
		return;
	}

	if (!existing) {
		const [created] = await db
			.insert(task)
			.values({
				organizationId: params.orgId,
				clientId: params.clientId,
				policyId: params.policyId,
				claimId: params.claimId,
				title,
				description,
				taskType: 'claim',
				workflowKey,
				priority: 'high',
				status: params.claimStatus === 'in_progress' ? 'in_progress' : 'todo',
				createdById: params.performedById,
				assignedToId: null
			})
			.returning({ id: task.id });

		await logActivity({
			organizationId: params.orgId,
			clientId: params.clientId,
			entityType: 'task',
			entityId: created.id,
			action: 'created',
			description: `System created claim task for claim ${params.claimNumber}`,
			performedById: params.performedById,
			metadata: { workflowKey }
		});
		return;
	}

	const nextStatus = params.claimStatus === 'in_progress' ? 'in_progress' : 'todo';
	const wasDone = existing.status === 'done';

	await db
		.update(task)
		.set({
			clientId: params.clientId,
			policyId: params.policyId,
			claimId: params.claimId,
			title,
			description,
			taskType: 'claim',
			priority: 'high',
			status: nextStatus,
			completedAt: null,
			updatedAt: new Date()
		})
		.where(eq(task.id, existing.id));

	if (wasDone) {
		await logActivity({
			organizationId: params.orgId,
			clientId: params.clientId,
			entityType: 'task',
			entityId: existing.id,
			action: 'status_changed',
			description: `System reopened claim task for claim ${params.claimNumber}`,
			performedById: params.performedById,
			metadata: { workflowKey }
		});
	}
}

export async function completeWorkflowTask(params: {
	orgId: string;
	workflowKey: string;
	clientId: string | null;
	description: string;
	performedById: string;
}) {
	const existing = await getWorkflowTask(params.orgId, params.workflowKey);
	if (!existing || existing.status === 'done') return;

	await db
		.update(task)
		.set({
			status: 'done',
			completedAt: existing.completedAt ?? new Date(),
			updatedAt: new Date()
		})
		.where(eq(task.id, existing.id));

	await logActivity({
		organizationId: params.orgId,
		clientId: params.clientId,
		entityType: 'task',
		entityId: existing.id,
		action: 'completed',
		description: params.description,
		performedById: params.performedById,
		metadata: { workflowKey: params.workflowKey }
	});
}

export function buildRenewalWorkflowKey(policyId: string) {
	return renewalWorkflowKey(policyId);
}

export function buildClaimWorkflowKey(claimId: string) {
	return claimWorkflowKey(claimId);
}
