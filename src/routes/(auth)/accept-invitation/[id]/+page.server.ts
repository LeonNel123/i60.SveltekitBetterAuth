import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, `/login?redirect=/accept-invitation/${params.id}`);
	}
	return { invitationId: params.id };
};

export const actions: Actions = {
	accept: async ({ params, request }) => {
		try {
			await auth.api.acceptInvitation({
				headers: request.headers,
				body: { invitationId: params.id }
			});
		} catch {
			return { error: 'Failed to accept invitation. It may have expired.' };
		}
		throw redirect(303, '/dashboard');
	},
	reject: async ({ params, request }) => {
		try {
			await auth.api.rejectInvitation({
				headers: request.headers,
				body: { invitationId: params.id }
			});
		} catch {
			return { error: 'Failed to reject invitation.' };
		}
		throw redirect(303, '/dashboard');
	}
};
