import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, admin, twoFactor, emailOTP } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import {
	BETTER_AUTH_URL,
	BETTER_AUTH_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	MICROSOFT_CLIENT_ID,
	MICROSOFT_CLIENT_SECRET
} from '$env/static/private';
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
	socialProviders: {
		...(GOOGLE_CLIENT_ID &&
			GOOGLE_CLIENT_SECRET && {
				google: {
					clientId: GOOGLE_CLIENT_ID,
					clientSecret: GOOGLE_CLIENT_SECRET,
					prompt: 'select_account' as const
				}
			}),
		...(GITHUB_CLIENT_ID &&
			GITHUB_CLIENT_SECRET && {
				github: {
					clientId: GITHUB_CLIENT_ID,
					clientSecret: GITHUB_CLIENT_SECRET
				}
			}),
		...(MICROSOFT_CLIENT_ID &&
			MICROSOFT_CLIENT_SECRET && {
				microsoft: {
					clientId: MICROSOFT_CLIENT_ID,
					clientSecret: MICROSOFT_CLIENT_SECRET,
					tenantId: 'common',
					prompt: 'select_account' as const
				}
			})
	},
	// emailVerification.sendOnSignUp is false because the emailOTP plugin handles
	// verification via OTP codes instead (sendVerificationOnSignUp: true below).
	// If you remove the emailOTP plugin, set sendOnSignUp: true here and implement
	// emailVerification.sendVerificationEmail to restore email verification.
	emailVerification: {
		sendOnSignUp: false,
		autoSignInAfterVerification: true
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
		}),
		emailOTP({
			otpLength: 6,
			expiresIn: 300,
			sendVerificationOnSignUp: true,
			async sendVerificationOTP({ email, otp, type }) {
				const subjects: Record<string, string> = {
					'email-verification': `Your verification code — ${APP_NAME}`,
					'sign-in': `Your sign-in code — ${APP_NAME}`,
					'forget-password': `Your password reset code — ${APP_NAME}`
				};
				await sendEmail({
					to: email,
					subject: subjects[type] ?? `Your code — ${APP_NAME}`,
					html: `<p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:4px">${otp}</p><p>This code expires in 5 minutes.</p>`,
					text: `Your verification code is: ${otp}. This code expires in 5 minutes.`
				});
			}
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
			'/reset-password': { window: 60, max: 5 },
			'/two-factor/*': { window: 60, max: 5 }
		}
	}
});

export type Session = typeof auth.$Infer.Session;
