import { db } from '$lib/server/db';
import { document, client } from '$lib/server/db/schema';
import { eq, desc, ilike, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return { documents: [], search: '' };

	const search = url.searchParams.get('q')?.trim() ?? '';

	const where = search
		? and(eq(document.organizationId, orgId), ilike(document.name, `%${search}%`))
		: eq(document.organizationId, orgId);

	const documents = await db
		.select({ document: document, clientName: client.name })
		.from(document)
		.leftJoin(client, eq(document.clientId, client.id))
		.where(where)
		.orderBy(desc(document.createdAt))
		.limit(100);

	return {
		documents: documents.map((r) => ({ ...r.document, clientName: r.clientName })),
		search
	};
};
