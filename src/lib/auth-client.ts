import { createAuthClient } from 'better-auth/svelte';
import { organizationClient, twoFactorClient, adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [
		organizationClient(),
		twoFactorClient({
			twoFactorPage: '/two-factor'
		}),
		adminClient()
	]
});
