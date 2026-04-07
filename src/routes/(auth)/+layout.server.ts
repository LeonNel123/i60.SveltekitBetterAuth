import { getSafeRedirectPath } from '$lib/utils/safe-redirect';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const next = getSafeRedirectPath(url.searchParams.get('next'));

	if (locals.user) {
		if (!locals.user.emailVerified) {
			if (url.pathname === '/verify-email' || url.pathname === '/two-factor') {
				return;
			}

			throw redirect(
				303,
				`/verify-email?email=${encodeURIComponent(locals.user.email)}&next=${encodeURIComponent(next)}`
			);
		}

		throw redirect(303, next);
	}
};
