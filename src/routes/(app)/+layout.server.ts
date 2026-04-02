import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/login');
	}

	let members: { id: string; userId: string; role: string; user: { id: string; name: string; email: string; image?: string | null } }[] = [];

	if (locals.session.activeOrganizationId) {
		const org = await auth.api.getFullOrganization({
			headers: request.headers,
			query: { organizationId: locals.session.activeOrganizationId }
		});
		members = org?.members ?? [];
	}

	return {
		user: locals.user,
		session: locals.session,
		members
	};
};
