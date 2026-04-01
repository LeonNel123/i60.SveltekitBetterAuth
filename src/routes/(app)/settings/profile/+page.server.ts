import { auth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name is required' });
		}
		try {
			await auth.api.updateUser({
				headers: request.headers,
				body: { name: name.trim() }
			});
		} catch {
			return fail(500, { error: 'Failed to update profile. Please try again.' });
		}
		return { success: true };
	}
};
