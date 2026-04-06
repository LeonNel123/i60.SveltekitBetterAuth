import { auth } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request, parent }) => {
	const parentData = await parent();

	if (!locals.session?.activeOrganizationId) {
		return {
			organization: null,
			members: [],
			invitations: [],
			organizations: parentData.organizations
		};
	}

	const org = await auth.api.getFullOrganization({
		headers: request.headers,
		query: { organizationId: locals.session.activeOrganizationId }
	});

	return {
		organization: org,
		members: org?.members ?? [],
		invitations: org?.invitations ?? [],
		organizations: parentData.organizations
	};
};
