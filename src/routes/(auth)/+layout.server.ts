import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		if (!locals.user.emailVerified) {
			if (url.pathname === '/verify-email') {
				return;
			}

			throw redirect(303, `/verify-email?email=${encodeURIComponent(locals.user.email)}`);
		}

		throw redirect(303, '/dashboard');
	}
};
