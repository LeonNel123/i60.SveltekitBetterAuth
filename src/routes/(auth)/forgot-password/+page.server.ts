import { auth } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return { success: false };
		}

		try {
			await auth.api.requestPasswordReset({
				headers: request.headers,
				body: { email, redirectTo: '/login' }
			});
		} catch {
			// Always return success to prevent email enumeration
		}

		return { success: true, email };
	}
};
