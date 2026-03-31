import { auth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { user: locals.user! };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name is required' });
		}
		await auth.api.updateUser({
			headers: request.headers,
			body: { name: name.trim() }
		});
		return { success: true };
	}
};
