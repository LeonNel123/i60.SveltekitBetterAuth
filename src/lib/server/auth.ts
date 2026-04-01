import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, admin, twoFactor } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { BETTER_AUTH_URL, BETTER_AUTH_SECRET } from '$env/static/private';
import { db } from './db';

const statement = {
	organization: ['update', 'delete'],
	member: ['create', 'update', 'delete'],
	invitation: ['create', 'cancel']
} as const;

const ac = createAccessControl(statement);

const memberRole = ac.newRole({
	organization: [],
	member: [],
	invitation: []
});

const adminRole = ac.newRole({
	organization: ['update'],
	member: ['create', 'update', 'delete'],
	invitation: ['create', 'cancel']
});

const ownerRole = ac.newRole({
	organization: ['update', 'delete'],
	member: ['create', 'update', 'delete'],
	invitation: ['create', 'cancel']
});

export const auth = betterAuth({
	baseURL: BETTER_AUTH_URL,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		autoSignIn: true,
		async sendResetPassword({ user, url }) {
			// TODO: Replace with real email provider (Resend, Postmark, etc.)
			console.log(`[DEV] Password reset for ${user.email}: ${url}`);
		}
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			// TODO: Replace with real email provider
			console.log(`[DEV] Email verification for ${user.email}: ${url}`);
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent),
		organization({
			ac,
			roles: {
				owner: ownerRole,
				admin: adminRole,
				member: memberRole
			},
			allowUserToCreateOrganization: true,
			organizationLimit: 5,
			creatorRole: 'owner',
			membershipLimit: 50,
			invitationExpiresIn: 60 * 60 * 48,
			async sendInvitationEmail(data) {
				console.log(`[DEV] Invitation email for ${data.email}: /accept-invitation/${data.id}`);
			}
		}),
		admin({
			defaultRole: 'user',
			adminRoles: ['admin']
		}),
		twoFactor({
			issuer: 'Bokeros'
		})
	],
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60
		}
	},
	rateLimit: {
		window: 60,
		max: 100,
		customRules: {
			'/sign-in/email': { window: 60, max: 5 },
			'/sign-up/email': { window: 60, max: 3 },
			'/request-password-reset': { window: 60, max: 3 },
			'/two-factor/*': { window: 60, max: 5 }
		}
	}
});

export type Session = typeof auth.$Infer.Session;
