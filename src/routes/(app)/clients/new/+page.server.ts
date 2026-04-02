import { db } from '$lib/server/db';
import { client } from '$lib/server/db/schema';
import { logActivity } from '$lib/server/activity';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const orgId = locals.session?.activeOrganizationId;
		if (!orgId || !locals.user) return fail(403, { error: 'No active organisation.' });

		const fd = await request.formData();
		const name = (fd.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Name is required.' });

		const type = (fd.get('type') as string) || 'individual';
		const email = (fd.get('email') as string)?.trim() || null;
		const phone = (fd.get('phone') as string)?.trim() || null;
		const idNumber = (fd.get('idNumber') as string)?.trim() || null;
		const registrationNumber = (fd.get('registrationNumber') as string)?.trim() || null;
		const address = (fd.get('address') as string)?.trim() || null;

		try {
			const [created] = await db.insert(client).values({
				organizationId: orgId,
				type,
				name,
				email,
				phone,
				idNumber,
				registrationNumber,
				address,
				createdById: locals.user.id
			}).returning();

			await logActivity({
				organizationId: orgId,
				clientId: created.id,
				entityType: 'client',
				entityId: created.id,
				action: 'created',
				description: `Created client "${name}"`,
				performedById: locals.user.id
			});

			throw redirect(303, `/clients/${created.id}`);
		} catch (e) {
			if (isRedirect(e)) throw e;
			return fail(500, { error: 'Failed to create client.' });
		}
	}
};
