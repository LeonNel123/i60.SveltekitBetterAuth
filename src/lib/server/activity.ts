import { db } from './db';
import { activity } from './db/schema';
import type { ActivityAction, EntityType } from '$lib/types';

export async function logActivity(params: {
	organizationId: string;
	clientId?: string | null;
	entityType: EntityType;
	entityId: string;
	action: ActivityAction;
	description: string;
	performedById: string;
	metadata?: Record<string, unknown>;
}) {
	await db.insert(activity).values({
		organizationId: params.organizationId,
		clientId: params.clientId ?? null,
		entityType: params.entityType,
		entityId: params.entityId,
		action: params.action,
		description: params.description,
		performedById: params.performedById,
		metadata: params.metadata ?? null
	});
}
