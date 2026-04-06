import { db } from '$lib/server/db';
import { client } from '$lib/server/db/schema';
import { eq, ilike, or, desc, sql, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return { clients: [], total: 0, page: 1, perPage: 20, search: '' };

	const search = url.searchParams.get('q')?.trim() ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const perPage = 20;

	const baseCondition = eq(client.organizationId, orgId);

	const where = search
		? and(
				baseCondition,
				or(
					ilike(client.name, `%${search}%`),
					ilike(client.email, `%${search}%`),
					ilike(client.phone, `%${search}%`),
					ilike(client.idNumber, `%${search}%`),
					ilike(client.registrationNumber, `%${search}%`)
				)
			)
		: baseCondition;

	const [clients, countResult] = await Promise.all([
		db
			.select()
			.from(client)
			.where(where)
			.orderBy(desc(client.createdAt))
			.limit(perPage)
			.offset((page - 1) * perPage),
		db
			.select({ count: sql<number>`count(*)` })
			.from(client)
			.where(where)
	]);

	return {
		clients,
		total: Number(countResult[0].count),
		page,
		perPage,
		search
	};
};
