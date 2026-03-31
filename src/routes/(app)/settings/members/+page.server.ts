import { auth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session?.activeOrganizationId) {
		return { members: [], invitations: [] };
	}
	const org = await auth.api.getFullOrganization({
		headers: new Headers(),
		query: { organizationId: locals.session.activeOrganizationId }
	});
	return {
		members: org?.members ?? [],
		invitations: org?.invitations ?? []
	};
};
