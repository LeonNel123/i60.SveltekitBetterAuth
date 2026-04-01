import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { email, error: 'Email and password are required' });
		}

		try {
			const result = await auth.api.signInEmail({
				headers: request.headers,
				body: { email, password }
			});

			// 2FA redirect: when twoFactor plugin is active, a 2FA-required response has no token
			if (result && 'twoFactorRedirect' in result) {
				throw redirect(303, '/two-factor');
			}
		} catch (e) {
			// Re-throw SvelteKit redirects
			if (e && typeof e === 'object' && 'status' in e) throw e;
			return fail(400, { email, error: 'Invalid email or password' });
		}

		throw redirect(303, '/dashboard');
	}
};
