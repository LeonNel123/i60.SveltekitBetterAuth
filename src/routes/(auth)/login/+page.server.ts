import { getSafeRedirectPath } from '$lib/utils/safe-redirect';
import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID, MICROSOFT_CLIENT_ID } from '$env/static/private';
import type { Actions, PageServerLoad } from './$types';

function isRealValue(v: string): boolean {
	return !!v && v !== 'none';
}

export const load: PageServerLoad = async () => {
	return {
		hasGoogle: isRealValue(GOOGLE_CLIENT_ID),
		hasGithub: isRealValue(GITHUB_CLIENT_ID),
		hasMicrosoft: isRealValue(MICROSOFT_CLIENT_ID)
	};
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const next = getSafeRedirectPath(url.searchParams.get('next'));

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
				throw redirect(303, `/two-factor?next=${encodeURIComponent(next)}`);
			}
		} catch (e) {
			// Re-throw SvelteKit redirects
			if (
				e &&
				typeof e === 'object' &&
				'status' in e &&
				(e as { status: number }).status >= 300 &&
				(e as { status: number }).status < 400
			)
				throw e;
			return fail(400, { email, error: 'Invalid email or password' });
		}

		throw redirect(303, next);
	}
};
