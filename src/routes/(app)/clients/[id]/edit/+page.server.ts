import { db } from '$lib/server/db';
import { client } from '$lib/server/db/schema';
import { logActivity } from '$lib/server/activity';
import { CLIENT_TYPES } from '$lib/types';
import { isOneOf } from '$lib/utils';
import { eq, and } from 'drizzle-orm';
import { error, fail, redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const orgId = locals.session?.activeOrganizationId;
	if (!orgId) return error(403, 'No active organisation');

	const [found] = await db
		.select()
		.from(client)
		.where(and(eq(client.id, params.id), eq(client.organizationId, orgId)));
	if (!found) return error(404, 'Client not found');
	return { client: found };
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'Not authorised.' });

		const fd = await request.formData();
		const name = (fd.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Name is required.' });

		const type = (fd.get('type') as string) || 'individual';
		if (!isOneOf(type, CLIENT_TYPES)) return fail(400, { error: 'Invalid client type.' });

		const email = (fd.get('email') as string)?.trim() || null;
		const phone = (fd.get('phone') as string)?.trim() || null;
		const idNumber = (fd.get('idNumber') as string)?.trim() || null;
		const registrationNumber = (fd.get('registrationNumber') as string)?.trim() || null;
		const address = (fd.get('address') as string)?.trim() || null;

		try {
			await db
				.update(client)
				.set({
					type,
					name,
					email,
					phone,
					idNumber,
					registrationNumber,
					address,
					updatedAt: new Date()
				})
				.where(and(eq(client.id, params.id), eq(client.organizationId, orgId)));

			await logActivity({
				organizationId: orgId,
				clientId: params.id,
				entityType: 'client',
				entityId: params.id,
				action: 'updated',
				description: `Updated client "${name}"`,
				performedById: locals.user.id
			});
			throw redirect(303, `/clients/${params.id}`);
		} catch (e) {
			if (isRedirect(e)) throw e;
			return fail(500, { error: 'Failed to update client.' });
		}
	}
};
