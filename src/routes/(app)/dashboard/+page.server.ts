import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		userName: locals.user?.name ?? 'there'
	};
};
