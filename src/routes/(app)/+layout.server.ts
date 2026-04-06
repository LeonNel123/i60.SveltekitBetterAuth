import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { getOrganizationAccessContext } from '$lib/server/organization';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/login');
	}

	const { activeOrganizationId, organizations } = await getOrganizationAccessContext(
		request.headers,
		locals.session
	);

	if (locals.session.activeOrganizationId !== activeOrganizationId) {
		locals.session = {
			...locals.session,
			activeOrganizationId: activeOrganizationId ?? undefined
		};
	}

	let members: {
		id: string;
		userId: string;
		role: string;
		user: { id: string; name: string; email: string; image?: string | null };
	}[] = [];

	if (activeOrganizationId) {
		const org = await auth.api.getFullOrganization({
			headers: request.headers,
			query: { organizationId: activeOrganizationId }
		});
		members = org?.members ?? [];
	}

	return {
		user: locals.user,
		session: locals.session,
		members,
		organizations
	};
};
