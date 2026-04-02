import { auth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.session?.activeOrganizationId) {
		return { memberCount: 0, pendingInvitations: 0, organizationName: null };
	}

	const org = await auth.api.getFullOrganization({
		headers: request.headers,
		query: { organizationId: locals.session.activeOrganizationId }
	});

	return {
		memberCount: org?.members?.length ?? 0,
		pendingInvitations: org?.invitations?.filter((i) => i.status === 'pending')?.length ?? 0,
		organizationName: org?.name ?? null
	};
};
