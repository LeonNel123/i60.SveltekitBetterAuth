import { auth } from '$lib/server/auth';
import { getSafeRedirectPath } from '$lib/utils/safe-redirect';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { seedSystemTags } from '$lib/server/seed-tags';

const unverifiedAllowedPaths = new Set([
	'/verify-email',
	'/login',
	'/register',
	'/forgot-password',
	'/reset-password',
	'/two-factor'
]);

export const handle: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	await seedSystemTags();

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = session?.session ?? null;
	event.locals.user = session?.user ?? null;

	const currentPath = getSafeRedirectPath(`${event.url.pathname}${event.url.search}`);
	const isProtectedRoute =
		event.route.id?.startsWith('/(app)') || event.route.id === '/accept-invitation/[id]';

	if (isProtectedRoute && (!event.locals.user || !event.locals.session)) {
		throw redirect(303, `/login?next=${encodeURIComponent(currentPath)}`);
	}

	// Block banned users from all routes except /banned and sign-out
	if (event.locals.user?.banned) {
		if (event.url.pathname.startsWith('/api/auth')) {
			// Allow sign-out for banned users, block everything else
			if (!event.url.pathname.includes('sign-out')) {
				return json({ error: 'Account suspended' }, { status: 403 });
			}
		} else if (!event.url.pathname.startsWith('/banned')) {
			throw redirect(303, '/banned');
		}
	}

	if (
		event.route.id &&
		event.locals.user &&
		!event.locals.user.emailVerified &&
		!event.url.pathname.startsWith('/api/auth') &&
		!event.url.pathname.startsWith('/banned') &&
		!unverifiedAllowedPaths.has(event.url.pathname)
	) {
		if (event.url.pathname.startsWith('/api')) {
			return json({ error: 'Email verification required' }, { status: 403 });
		}

		throw redirect(
			303,
			`/verify-email?email=${encodeURIComponent(event.locals.user.email)}&next=${encodeURIComponent(currentPath)}`
		);
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
