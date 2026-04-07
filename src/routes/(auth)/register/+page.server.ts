import { auth } from '$lib/server/auth';
import { getSafeRedirectPath } from '$lib/utils/safe-redirect';
import { fail, redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID, MICROSOFT_CLIENT_ID } from '$env/static/private';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		hasGoogle: !!GOOGLE_CLIENT_ID,
		hasGithub: !!GITHUB_CLIENT_ID,
		hasMicrosoft: !!MICROSOFT_CLIENT_ID
	};
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const next = getSafeRedirectPath(url.searchParams.get('next'));

		if (!name || !email || !password) {
			return fail(400, { name, email, error: 'All fields are required' });
		}

		if (password.length < 8) {
			return fail(400, { name, email, error: 'Password must be at least 8 characters' });
		}

		const response = await auth.api.signUpEmail({
			headers: request.headers,
			body: { name, email, password },
			asResponse: true
		});

		if (response.ok) {
			throw redirect(
				303,
				`/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`
			);
		}

		const errorBody = (await response.json().catch(() => null)) as {
			code?: string;
			message?: string;
		} | null;

		if (response.status === 422 && errorBody?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
			await auth.api
				.sendVerificationOTP({
					body: {
						email,
						type: 'email-verification'
					}
				})
				.catch(() => undefined);

			throw redirect(
				303,
				`/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`
			);
		}

		if (response.status === 429) {
			return fail(429, {
				name,
				email,
				error: 'Too many attempts. Please wait a moment and try again.'
			});
		}

		return fail(400, {
			name,
			email,
			error: errorBody?.message ?? 'Could not create account. Please try again.'
		});
	}
};
