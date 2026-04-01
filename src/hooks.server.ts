import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	if (!event.url.pathname.startsWith('/api/auth')) {
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		event.locals.session = session?.session ?? null;
		event.locals.user = session?.user ?? null;

		if (event.locals.user?.banned && !event.url.pathname.startsWith('/banned')) {
			throw redirect(303, '/banned');
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
