import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	if (!token) {
		throw redirect(303, '/forgot-password');
	}
	return { token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const newPassword = formData.get('newPassword') as string;
		const confirmPassword = formData.get('confirmPassword') as string;
		const token = formData.get('token') as string;

		if (!newPassword || !confirmPassword || !token) {
			return fail(400, { error: 'All fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		try {
			await auth.api.resetPassword({
				headers: request.headers,
				body: { newPassword, token }
			});
		} catch {
			return fail(400, {
				error: 'Reset link is invalid or expired. Please request a new one.'
			});
		}

		throw redirect(303, '/login?reset=success');
	}
};
