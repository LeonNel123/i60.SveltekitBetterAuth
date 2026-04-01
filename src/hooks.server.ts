import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	// Skip session lookup for Better Auth API routes — svelteKitHandler handles them
	if (!event.url.pathname.startsWith('/api/auth')) {
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		event.locals.session = session?.session ?? null;
		event.locals.user = session?.user ?? null;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
