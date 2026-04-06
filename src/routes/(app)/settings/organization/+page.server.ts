import { fail, redirect } from '@sveltejs/kit';

import { auth } from '$lib/server/auth';
import {
	claimOrphanOrganizationForUser,
	getOrganizationAccessContext,
	normalizeOrganizationSlug
} from '$lib/server/organization';

import type { Actions } from './$types';

function getAuthErrorMessage(error: unknown): string {
	if (
		typeof error === 'object' &&
		error &&
		'body' in error &&
		typeof error.body === 'object' &&
		error.body &&
		'message' in error.body &&
		typeof error.body.message === 'string'
	) {
		return error.body.message;
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return 'Something went wrong while updating the organization.';
}

export const actions: Actions = {
	activate: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { activateError: 'You must be signed in to continue.' });
		}

		const formData = await request.formData();
		const organizationId = String(formData.get('organizationId') ?? '').trim();

		if (!organizationId) {
			return fail(400, { activateError: 'Select an organization to continue.' });
		}

		const { organizations } = await getOrganizationAccessContext(request.headers, locals.session);
		const organization = organizations.find((candidate) => candidate.id === organizationId);

		if (!organization) {
			return fail(400, {
				activateError: 'That organization is not linked to your account.'
			});
		}

		await auth.api.setActiveOrganization({
			headers: request.headers,
			body: { organizationId: organization.id }
		});

		throw redirect(303, '/settings/organization');
	},
	create: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, {
				createError: 'You must be signed in to create an organization.'
			});
		}

		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const slugInput = String(formData.get('slug') ?? '').trim();
		const slug = normalizeOrganizationSlug(slugInput || name);

		if (!name) {
			return fail(400, {
				createError: 'Organization name is required.',
				values: { name, slug: slugInput }
			});
		}

		if (!slug) {
			return fail(400, {
				createError: 'Enter a valid organization slug.',
				values: { name, slug: slugInput }
			});
		}

		const { organizations } = await getOrganizationAccessContext(request.headers, locals.session);

		if (organizations.length > 0 && !locals.session.activeOrganizationId) {
			return fail(400, {
				createError:
					'Your account already belongs to an organization. Restore that organization instead of creating a new one.',
				values: { name, slug: slugInput }
			});
		}

		try {
			await auth.api.createOrganization({
				headers: request.headers,
				body: { name, slug }
			});
		} catch (error) {
			const claimedOrganization =
				organizations.length < 5
					? await claimOrphanOrganizationForUser(slug, locals.user.id)
					: null;

			if (claimedOrganization) {
				await auth.api.setActiveOrganization({
					headers: request.headers,
					body: { organizationId: claimedOrganization.id }
				});

				throw redirect(303, '/settings/organization');
			}

			const linkedOrganizations = await auth.api.listOrganizations({
				headers: request.headers
			});
			const matchingOrganization = linkedOrganizations.find(
				(organization) => organization.slug === slug
			);

			if (matchingOrganization) {
				await auth.api.setActiveOrganization({
					headers: request.headers,
					body: { organizationId: matchingOrganization.id }
				});

				throw redirect(303, '/settings/organization');
			}

			return fail(400, {
				createError: `${getAuthErrorMessage(error)} If this organization should belong to your account but is not listed below, the production record needs a one-time membership repair.`,
				values: { name, slug: slugInput }
			});
		}

		throw redirect(303, '/settings/organization');
	}
};
