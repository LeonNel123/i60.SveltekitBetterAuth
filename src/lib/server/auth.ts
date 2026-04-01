import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, admin, twoFactor } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { BETTER_AUTH_URL, BETTER_AUTH_SECRET } from '$env/static/private';
import { db } from './db';
import { sendEmail } from './email';
import { APP_NAME } from '$lib/config';

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
			await sendEmail({
				to: user.email,
				subject: `Reset your password — ${APP_NAME}`,
				html: `<p>Click the link below to reset your password:</p><p><a href="${url}">Reset password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
				text: `Reset your password: ${url}`
			});
		}
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: `Verify your email — ${APP_NAME}`,
				html: `<p>Click the link below to verify your email address:</p><p><a href="${url}">Verify email</a></p>`,
				text: `Verify your email: ${url}`
			});
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
				const inviteUrl = `${BETTER_AUTH_URL}/accept-invitation/${data.id}`;
				await sendEmail({
					to: data.email,
					subject: `You've been invited to join an organization — ${APP_NAME}`,
					html: `<p>You've been invited to join an organization on ${APP_NAME}.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
					text: `Accept invitation: ${inviteUrl}`
				});
			}
		}),
		admin({
			defaultRole: 'user',
			adminRoles: ['admin']
		}),
		twoFactor({
			issuer: APP_NAME
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
