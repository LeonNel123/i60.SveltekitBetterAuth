import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!name || !email || !password) {
			return fail(400, { name, email, error: 'All fields are required' });
		}

		if (password.length < 8) {
			return fail(400, { name, email, error: 'Password must be at least 8 characters' });
		}

		try {
			await auth.api.signUpEmail({
				headers: request.headers,
				body: { name, email, password }
			});
		} catch {
			return fail(400, { name, email, error: 'Could not create account. Email may already be in use.' });
		}

		throw redirect(303, '/dashboard');
	}
};
