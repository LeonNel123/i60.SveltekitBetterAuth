import { and, eq, sql } from 'drizzle-orm';

import { auth, type Session } from './auth';
import { db } from './db';
import { member, organization } from './db/schema';

type ListedOrganization = Awaited<ReturnType<typeof auth.api.listOrganizations>>[number];

export function normalizeOrganizationSlug(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export async function getOrganizationAccessContext(
	requestHeaders: Headers,
	session: Session['session'] | null
): Promise<{
	activeOrganizationId: string | null;
	organizations: ListedOrganization[];
}> {
	if (!session) {
		return { activeOrganizationId: null, organizations: [] };
	}

	const organizations = await auth.api.listOrganizations({
		headers: requestHeaders
	});

	let activeOrganizationId = session.activeOrganizationId ?? null;
	const hasActiveOrganization = activeOrganizationId
		? organizations.some((org) => org.id === activeOrganizationId)
		: false;

	if (activeOrganizationId && !hasActiveOrganization) {
		await auth.api.setActiveOrganization({
			headers: requestHeaders,
			body: { organizationId: null }
		});
		activeOrganizationId = null;
	}

	if (!activeOrganizationId && organizations.length === 1) {
		await auth.api.setActiveOrganization({
			headers: requestHeaders,
			body: { organizationId: organizations[0].id }
		});
		activeOrganizationId = organizations[0].id;
	}

	return {
		activeOrganizationId,
		organizations
	};
}

export async function claimOrphanOrganizationForUser(slug: string, userId: string) {
	return db.transaction(async (tx) => {
		await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`claim-org:${slug}`}))`);

		const [existingOrganization] = await tx
			.select({
				id: organization.id,
				name: organization.name,
				slug: organization.slug,
				logo: organization.logo,
				createdAt: organization.createdAt,
				metadata: organization.metadata
			})
			.from(organization)
			.where(eq(organization.slug, slug))
			.limit(1);

		if (!existingOrganization) {
			return null;
		}

		const [existingUserMembership] = await tx
			.select({ id: member.id })
			.from(member)
			.where(and(eq(member.organizationId, existingOrganization.id), eq(member.userId, userId)))
			.limit(1);

		if (existingUserMembership) {
			return existingOrganization;
		}

		const [existingMember] = await tx
			.select({ id: member.id })
			.from(member)
			.where(eq(member.organizationId, existingOrganization.id))
			.limit(1);

		if (existingMember) {
			return null;
		}

		await tx.insert(member).values({
			id: crypto.randomUUID(),
			organizationId: existingOrganization.id,
			userId,
			role: 'owner',
			createdAt: new Date()
		});

		return existingOrganization;
	});
}

export async function resolveOrgMemberUserId(
	orgId: string,
	requestedUserId: string | null | undefined
): Promise<string | null> {
	const userId = requestedUserId?.trim();
	if (!userId) return null;

	const [orgMember] = await db
		.select({ userId: member.userId })
		.from(member)
		.where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
		.limit(1);

	return orgMember?.userId ?? null;
}

