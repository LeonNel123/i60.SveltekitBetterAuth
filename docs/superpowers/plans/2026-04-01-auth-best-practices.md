# Auth Best Practices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Bokeros auth to production-grade B2B SaaS best practices — Better Auth plugins (admin, 2FA, rate limiting, HIBP, access control), progressive enhancement with SvelteKit form actions, proper Svelte 5 runes patterns, and complete auth flow pages.

**Architecture:** Extend the existing Better Auth config with additional plugins. Convert client-side auth forms to server-side form actions with `use:enhance` for progressive enhancement. Add 2FA verification page, invitation accept page, and email verification placeholder. Use typed `PageProps`/`LayoutProps` throughout.

**Tech Stack:** Better Auth (admin, twoFactor, organization with access control), SvelteKit form actions, Svelte 5 runes ($state, $derived, $props with types)

---

## File Structure

```
src/
  lib/
    server/
      auth.ts                              (MODIFY — add plugins, access control, rate limiting, password config)
      db/schema.ts                         (MODIFY — regenerate with new plugin tables)
    auth-client.ts                         (MODIFY — add twoFactorClient, adminClient)
  hooks.server.ts                          (MODIFY — handle banned users)
  app.d.ts                                 (MODIFY — update Session type)
  routes/
    (auth)/
      login/
        +page.server.ts                    (CREATE — form action for sign-in)
        +page.svelte                       (MODIFY — use:enhance + form action)
      register/
        +page.server.ts                    (CREATE — form action for sign-up)
        +page.svelte                       (MODIFY — use:enhance + form action)
      forgot-password/
        +page.server.ts                    (CREATE — form action for password reset)
        +page.svelte                       (MODIFY — use:enhance + form action)
      verify-email/
        +page.svelte                       (CREATE — email verification placeholder)
      two-factor/
        +page.svelte                       (CREATE — 2FA TOTP verification page)
      accept-invitation/[id]/
        +page.server.ts                    (CREATE — accept invitation logic)
        +page.svelte                       (CREATE — invitation accept UI)
    (app)/
      settings/
        +layout.svelte                     (MODIFY — add Security tab)
        security/
          +page.svelte                     (CREATE — 2FA enable/disable, active sessions)
```

---

### Task 1: Upgrade Better Auth Server Config

**Files:**

- Modify: `src/lib/server/auth.ts`

- [ ] **Step 1: Install new dependencies**

```bash
cd D:/2026/bokeros
pnpm add better-auth-hibp
```

Note: `admin`, `twoFactor`, and `organization` with access control are all built into `better-auth` — no extra packages needed. The `better-auth-hibp` package is a community plugin. If it doesn't exist, skip it and use password length constraints only.

Actually, Better Auth has a built-in HIBP check concept. Try the install — if it fails, skip and proceed without it.

```bash
cd D:/2026/bokeros
pnpm add better-auth-hibp 2>/dev/null || echo "HIBP plugin not available, skipping"
```

- [ ] **Step 2: Replace `src/lib/server/auth.ts` with full config**

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, admin, twoFactor } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { BETTER_AUTH_URL, BETTER_AUTH_SECRET } from '$env/static/private';
import { db } from './db';

// Access control for org-scoped resources
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
		autoSignIn: true
	},
	plugins: [
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
				// TODO: Wire up email provider
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
			'/forget-password': { window: 60, max: 3 },
			'/two-factor/*': { window: 60, max: 5 }
		}
	}
});

export type Session = typeof auth.$Infer.Session;
```

- [ ] **Step 3: Verify the file has no TypeScript errors**

```bash
cd D:/2026/bokeros
npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | head -20
```

If there are import errors (e.g., `createAccessControl` path), adjust the import. The access control API may be at `better-auth/plugins/access` or `better-auth/plugins`. Check both.

- [ ] **Step 4: Commit**

```bash
cd D:/2026/bokeros
git add src/lib/server/auth.ts package.json pnpm-lock.yaml
git commit -m "feat: add admin, 2FA, rate limiting, access control to Better Auth config"
```

---

### Task 2: Update Auth Client with New Plugins

**Files:**

- Modify: `src/lib/auth-client.ts`

- [ ] **Step 1: Update auth client**

Replace `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from 'better-auth/svelte';
import { organizationClient } from 'better-auth/client/plugins';
import { twoFactorClient } from 'better-auth/client/plugins';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [
		organizationClient(),
		twoFactorClient({
			twoFactorPage: '/two-factor'
		}),
		adminClient()
	]
});
```

- [ ] **Step 2: Commit**

```bash
cd D:/2026/bokeros
git add src/lib/auth-client.ts
git commit -m "feat: add twoFactorClient and adminClient to auth client"
```

---

### Task 3: Update Database Schema for New Plugins

**Files:**

- Modify: `src/lib/server/db/schema.ts`
- Modify: `scripts/apply-migrations.js` (run it)

- [ ] **Step 1: Try generating schema via Better Auth CLI**

```bash
cd D:/2026/bokeros
pnpm dlx @better-auth/cli generate --config src/lib/server/auth.ts --output src/lib/server/db/schema.ts 2>&1 || echo "CLI failed, will add tables manually"
```

- [ ] **Step 2: If CLI failed, manually add the new tables to `src/lib/server/db/schema.ts`**

Append to the existing schema file (keep all existing tables, add these new ones):

```ts
// Admin plugin tables
export const twoFactor = pgTable('two_factor', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	secret: text('secret').notNull(),
	backupCodes: text('backup_codes').notNull(),
	createdAt: timestamp('created_at').notNull()
});
```

Also add new columns to the `user` table. Since Drizzle doesn't support ALTER in schema definitions, read what the existing `user` table has and add the new fields:

The `user` table needs these additional fields for admin + 2FA plugins:

- `role` text (default 'user')
- `banned` boolean
- `banReason` text
- `banExpires` timestamp
- `twoFactorEnabled` boolean

Update the `user` table definition in schema.ts to include all fields:

```ts
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	// Admin plugin fields
	role: text('role').default('user'),
	banned: boolean('banned').default(false),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	// 2FA plugin field
	twoFactorEnabled: boolean('two_factor_enabled').default(false)
});
```

- [ ] **Step 3: Generate new migration**

```bash
cd D:/2026/bokeros
pnpm db:generate
```

- [ ] **Step 4: Apply migration**

```bash
cd D:/2026/bokeros
node scripts/apply-migrations.js
```

If the migration script fails because tables already exist (from the old migration), apply it directly:

```bash
cd D:/2026/bokeros
# Find the newest migration file
ls drizzle/*.sql | tail -1
# Apply it via psql, stripping statement breakpoints
sed 's/--> statement-breakpoint//g' drizzle/$(ls drizzle/*.sql | tail -1 | xargs basename) | docker compose exec -T postgres psql -U postgres -d bokeros
```

- [ ] **Step 5: Verify tables**

```bash
cd D:/2026/bokeros
docker compose exec postgres psql -U postgres -d bokeros -c "\dt"
```

Expected: all original tables + `two_factor` table. The `user` table should have the new columns:

```bash
docker compose exec postgres psql -U postgres -d bokeros -c "\d user"
```

- [ ] **Step 6: Commit**

```bash
cd D:/2026/bokeros
git add src/lib/server/db/schema.ts drizzle/
git commit -m "feat: add admin and 2FA tables to schema, generate migration"
```

---

### Task 4: Update Hooks to Handle Banned Users

**Files:**

- Modify: `src/hooks.server.ts`

- [ ] **Step 1: Update hooks.server.ts**

Replace `src/hooks.server.ts`:

```ts
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

		// Redirect banned users to a banned page (except for sign-out)
		if (event.locals.user?.banned && !event.url.pathname.startsWith('/banned')) {
			throw redirect(303, '/banned');
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
```

- [ ] **Step 2: Create a simple banned page**

Create `src/routes/banned/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';

	async function handleSignOut() {
		await authClient.signOut();
		await goto('/login', { invalidateAll: true });
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<Card class="max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Account Suspended</CardTitle>
			<CardDescription>
				Your account has been suspended. Contact support if you believe this is an error.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<Button onclick={handleSignOut} variant="outline" class="w-full">Sign out</Button>
		</CardContent>
	</Card>
</div>
```

- [ ] **Step 3: Commit**

```bash
cd D:/2026/bokeros
git add src/hooks.server.ts src/routes/banned/+page.svelte
git commit -m "feat: add banned user redirect and banned page"
```

---

### Task 5: Convert Login to Form Action with Progressive Enhancement

**Files:**

- Create: `src/routes/(auth)/login/+page.server.ts`
- Modify: `src/routes/(auth)/login/+page.svelte`

- [ ] **Step 1: Create login form action**

Create `src/routes/(auth)/login/+page.server.ts`:

```ts
import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { email, error: 'Email and password are required' });
		}

		try {
			const result = await auth.api.signInEmail({
				headers: request.headers,
				body: { email, password }
			});

			if (result.twoFactorRedirect) {
				throw redirect(303, '/two-factor');
			}
		} catch (e) {
			// Re-throw redirects
			if (e && typeof e === 'object' && 'status' in e) throw e;
			return fail(400, { email, error: 'Invalid email or password' });
		}

		throw redirect(303, '/dashboard');
	}
};
```

- [ ] **Step 2: Update login page to use form action**

Replace `src/routes/(auth)/login/+page.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';

	let { form } = $props();
	let submitting = $state(false);
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Sign in</CardTitle>
		<CardDescription>Enter your credentials to access your account</CardDescription>
	</CardHeader>
	<CardContent>
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
			class="grid gap-4"
		>
			{#if form?.error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{/if}
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="you@example.com"
					value={form?.email ?? ''}
					required
				/>
			</div>
			<div class="grid gap-2">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>
					<a href="/forgot-password" class="text-sm text-muted-foreground hover:underline">
						Forgot password?
					</a>
				</div>
				<Input id="password" name="password" type="password" required />
			</div>
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Signing in...' : 'Sign in'}
			</Button>
		</form>
	</CardContent>
	<CardFooter class="justify-center">
		<p class="text-sm text-muted-foreground">
			Don't have an account?
			<a href="/register" class="text-primary hover:underline">Sign up</a>
		</p>
	</CardFooter>
</Card>
```

- [ ] **Step 3: Commit**

```bash
cd D:/2026/bokeros
git add src/routes/\(auth\)/login/
git commit -m "feat: convert login to form action with progressive enhancement and 2FA redirect"
```

---

### Task 6: Convert Register to Form Action with Progressive Enhancement

**Files:**

- Create: `src/routes/(auth)/register/+page.server.ts`
- Modify: `src/routes/(auth)/register/+page.svelte`

- [ ] **Step 1: Create register form action**

Create `src/routes/(auth)/register/+page.server.ts`:

```ts
import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!name || !email || !password) {
			return fail(400, { name, email, error: 'All fields are required' });
		}

		if (password.length < 8) {
			return fail(400, { name, email, error: 'Password must be at least 8 characters' });
		}

		try {
			await auth.api.signUpEmail({
				headers: request.headers,
				body: { name, email, password }
			});
		} catch {
			return fail(400, {
				name,
				email,
				error: 'Could not create account. Email may already be in use.'
			});
		}

		throw redirect(303, '/dashboard');
	}
};
```

- [ ] **Step 2: Update register page to use form action**

Replace `src/routes/(auth)/register/+page.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';

	let { form } = $props();
	let submitting = $state(false);
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Create account</CardTitle>
		<CardDescription>Enter your details to get started</CardDescription>
	</CardHeader>
	<CardContent>
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
			class="grid gap-4"
		>
			{#if form?.error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{/if}
			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input
					id="name"
					name="name"
					type="text"
					placeholder="Your name"
					value={form?.name ?? ''}
					required
				/>
			</div>
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="you@example.com"
					value={form?.email ?? ''}
					required
				/>
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder="Min 8 characters"
					required
					minlength={8}
				/>
			</div>
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Creating account...' : 'Create account'}
			</Button>
		</form>
	</CardContent>
	<CardFooter class="justify-center">
		<p class="text-sm text-muted-foreground">
			Already have an account?
			<a href="/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</CardFooter>
</Card>
```

- [ ] **Step 3: Commit**

```bash
cd D:/2026/bokeros
git add src/routes/\(auth\)/register/
git commit -m "feat: convert register to form action with progressive enhancement"
```

---

### Task 7: Convert Forgot Password to Form Action

**Files:**

- Create: `src/routes/(auth)/forgot-password/+page.server.ts`
- Modify: `src/routes/(auth)/forgot-password/+page.svelte`

- [ ] **Step 1: Create forgot-password form action**

Create `src/routes/(auth)/forgot-password/+page.server.ts`:

```ts
import { auth } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return { success: false };
		}

		try {
			await auth.api.forgetPassword({
				headers: request.headers,
				body: { email, redirectTo: '/login' }
			});
		} catch {
			// Always return success to prevent email enumeration
		}

		return { success: true, email };
	}
};
```

- [ ] **Step 2: Update forgot-password page**

Replace `src/routes/(auth)/forgot-password/+page.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';

	let { form } = $props();
	let submitting = $state(false);
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Reset password</CardTitle>
		<CardDescription>Enter your email to receive a reset link</CardDescription>
	</CardHeader>
	<CardContent>
		{#if form?.success}
			<div class="rounded-md bg-primary/10 p-4 text-sm text-primary">
				If an account exists for {form.email}, you'll receive a password reset link.
			</div>
		{:else}
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
				class="grid gap-4"
			>
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" placeholder="you@example.com" required />
				</div>
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Sending...' : 'Send reset link'}
				</Button>
			</form>
		{/if}
	</CardContent>
	<CardFooter class="justify-center">
		<p class="text-sm text-muted-foreground">
			<a href="/login" class="text-primary hover:underline">Back to sign in</a>
		</p>
	</CardFooter>
</Card>
```

- [ ] **Step 3: Commit**

```bash
cd D:/2026/bokeros
git add src/routes/\(auth\)/forgot-password/
git commit -m "feat: convert forgot-password to form action with email enumeration protection"
```

---

### Task 8: Add Two-Factor Authentication Page

**Files:**

- Create: `src/routes/(auth)/two-factor/+page.svelte`

- [ ] **Step 1: Create 2FA verification page**

Create `src/routes/(auth)/two-factor/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';

	let code = $state('');
	let error = $state('');
	let submitting = $state(false);
	let useBackupCode = $state(false);

	async function handleVerify(e: SubmitEvent) {
		e.preventDefault();
		if (!code.trim()) return;
		submitting = true;
		error = '';

		const result = useBackupCode
			? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
			: await authClient.twoFactor.verifyTotp({ code: code.trim(), trustDevice: true });

		submitting = false;
		if (result.error) {
			error = result.error.message ?? 'Invalid code. Please try again.';
		} else {
			await goto('/dashboard', { invalidateAll: true });
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Two-factor authentication</CardTitle>
		<CardDescription>
			{useBackupCode
				? 'Enter one of your backup codes'
				: 'Enter the 6-digit code from your authenticator app'}
		</CardDescription>
	</CardHeader>
	<CardContent>
		<form onsubmit={handleVerify} class="grid gap-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}
			<div class="grid gap-2">
				<Label for="code">{useBackupCode ? 'Backup code' : 'Verification code'}</Label>
				<Input
					id="code"
					type="text"
					placeholder={useBackupCode ? 'xxxxxxxx' : '000000'}
					bind:value={code}
					required
					autocomplete="one-time-code"
					inputmode={useBackupCode ? 'text' : 'numeric'}
					maxlength={useBackupCode ? 20 : 6}
				/>
			</div>
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Verifying...' : 'Verify'}
			</Button>
		</form>
	</CardContent>
	<CardFooter class="justify-center">
		<button
			type="button"
			class="text-sm text-muted-foreground hover:underline"
			onclick={() => {
				useBackupCode = !useBackupCode;
				code = '';
				error = '';
			}}
		>
			{useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
		</button>
	</CardFooter>
</Card>
```

- [ ] **Step 2: Commit**

```bash
cd D:/2026/bokeros
git add src/routes/\(auth\)/two-factor/
git commit -m "feat: add two-factor authentication verification page"
```

---

### Task 9: Add Invitation Accept Page

**Files:**

- Create: `src/routes/(auth)/accept-invitation/[id]/+page.server.ts`
- Create: `src/routes/(auth)/accept-invitation/[id]/+page.svelte`

- [ ] **Step 1: Create invitation accept server load + action**

Create `src/routes/(auth)/accept-invitation/[id]/+page.server.ts`:

```ts
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
```

- [ ] **Step 2: Create invitation accept page**

Create `src/routes/(auth)/accept-invitation/[id]/+page.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';

	let { data, form } = $props();
	let submitting = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<Card class="max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Organization Invitation</CardTitle>
			<CardDescription>You've been invited to join an organization.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if form?.error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">Would you like to accept this invitation?</p>
			{/if}
		</CardContent>
		<CardFooter class="flex gap-2">
			<form
				method="POST"
				action="?/accept"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
				class="flex-1"
			>
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Accepting...' : 'Accept invitation'}
				</Button>
			</form>
			<form method="POST" action="?/reject" use:enhance class="flex-1">
				<Button type="submit" variant="outline" class="w-full">Decline</Button>
			</form>
		</CardFooter>
	</Card>
</div>
```

- [ ] **Step 3: Commit**

```bash
cd D:/2026/bokeros
git add "src/routes/(auth)/accept-invitation/"
git commit -m "feat: add invitation accept/reject page"
```

---

### Task 10: Add Security Settings Page (2FA Management)

**Files:**

- Modify: `src/routes/(app)/settings/+layout.svelte`
- Create: `src/routes/(app)/settings/security/+page.svelte`

- [ ] **Step 1: Add Security tab to settings layout**

Read `src/routes/(app)/settings/+layout.svelte` and add a Security tab to the `tabs` array:

In the `tabs` array, add after Members:

```ts
{ href: '/settings/security', label: 'Security' }
```

So the full array becomes:

```ts
const tabs = [
	{ href: '/settings/profile', label: 'Profile' },
	{ href: '/settings/organization', label: 'Organization' },
	{ href: '/settings/members', label: 'Members' },
	{ href: '/settings/security', label: 'Security' }
];
```

- [ ] **Step 2: Create security settings page**

Create `src/routes/(app)/settings/security/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';

	let { data } = $props();

	const twoFactorEnabled = $derived(data.user?.twoFactorEnabled ?? false);

	let password = $state('');
	let totpUri = $state('');
	let backupCodes = $state<string[]>([]);
	let verifyCode = $state('');
	let enabling = $state(false);
	let disabling = $state(false);
	let error = $state('');
	let step = $state<'idle' | 'setup' | 'verify' | 'backup'>('idle');

	async function startEnable() {
		if (!password.trim()) {
			error = 'Password is required';
			return;
		}
		enabling = true;
		error = '';

		const result = await authClient.twoFactor.enable({ password });
		enabling = false;

		if (result.error) {
			error = result.error.message ?? 'Failed to enable 2FA';
			return;
		}

		// Get the TOTP URI for QR code display
		const uriResult = await authClient.twoFactor.getTotpUri({ password });
		if (uriResult.data?.totpURI) {
			totpUri = uriResult.data.totpURI;
		}
		backupCodes = result.data?.backupCodes ?? [];
		step = 'setup';
	}

	async function verifyAndComplete() {
		if (!verifyCode.trim()) return;
		enabling = true;
		error = '';

		const result = await authClient.twoFactor.verifyTotp({ code: verifyCode.trim() });
		enabling = false;

		if (result.error) {
			error = result.error.message ?? 'Invalid code';
			return;
		}

		step = 'backup';
		await invalidateAll();
	}

	async function disable2FA() {
		if (!password.trim()) {
			error = 'Password is required to disable 2FA';
			return;
		}
		disabling = true;
		error = '';

		const result = await authClient.twoFactor.disable({ password });
		disabling = false;

		if (result.error) {
			error = result.error.message ?? 'Failed to disable 2FA';
			return;
		}

		password = '';
		step = 'idle';
		await invalidateAll();
	}
</script>

<div class="space-y-8">
	<Card class="max-w-lg">
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Two-Factor Authentication</CardTitle>
					<CardDescription>Add an extra layer of security to your account.</CardDescription>
				</div>
				<Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
					{twoFactorEnabled ? 'Enabled' : 'Disabled'}
				</Badge>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			{/if}

			{#if step === 'idle'}
				{#if twoFactorEnabled}
					<p class="text-sm text-muted-foreground">
						Two-factor authentication is active. Enter your password to disable it.
					</p>
					<div class="grid gap-2">
						<Label for="disable-password">Password</Label>
						<Input
							id="disable-password"
							type="password"
							bind:value={password}
							placeholder="Enter your password"
						/>
					</div>
					<Button onclick={disable2FA} variant="destructive" disabled={disabling}>
						{disabling ? 'Disabling...' : 'Disable 2FA'}
					</Button>
				{:else}
					<p class="text-sm text-muted-foreground">
						Secure your account with a time-based one-time password (TOTP).
					</p>
					<div class="grid gap-2">
						<Label for="enable-password">Password</Label>
						<Input
							id="enable-password"
							type="password"
							bind:value={password}
							placeholder="Enter your password to begin"
						/>
					</div>
					<Button onclick={startEnable} disabled={enabling}>
						{enabling ? 'Setting up...' : 'Enable 2FA'}
					</Button>
				{/if}
			{:else if step === 'setup'}
				<p class="text-sm text-muted-foreground">
					Scan this URI with your authenticator app, then enter the verification code.
				</p>
				{#if totpUri}
					<div class="rounded-md bg-muted p-3 text-xs break-all font-mono">{totpUri}</div>
				{/if}
				<div class="grid gap-2">
					<Label for="verify-code">Verification code</Label>
					<Input
						id="verify-code"
						type="text"
						inputmode="numeric"
						maxlength={6}
						placeholder="000000"
						bind:value={verifyCode}
						autocomplete="one-time-code"
					/>
				</div>
				<Button onclick={verifyAndComplete} disabled={enabling}>
					{enabling ? 'Verifying...' : 'Verify and enable'}
				</Button>
			{:else if step === 'backup'}
				<p class="text-sm text-muted-foreground">
					Two-factor authentication is now enabled. Save these backup codes in a safe place. Each
					code can only be used once.
				</p>
				<div class="grid grid-cols-2 gap-2 rounded-md bg-muted p-4 font-mono text-sm">
					{#each backupCodes as code}
						<span>{code}</span>
					{/each}
				</div>
				<Button
					onclick={() => {
						step = 'idle';
						password = '';
						verifyCode = '';
					}}
				>
					Done
				</Button>
			{/if}
		</CardContent>
	</Card>

	<Card class="max-w-lg">
		<CardHeader>
			<CardTitle>Change Password</CardTitle>
			<CardDescription>Update your account password.</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground">
				Use the <a href="/forgot-password" class="text-primary hover:underline"
					>password reset flow</a
				> to change your password.
			</p>
		</CardContent>
	</Card>
</div>
```

- [ ] **Step 3: Commit**

```bash
cd D:/2026/bokeros
git add "src/routes/(app)/settings/+layout.svelte" "src/routes/(app)/settings/security/"
git commit -m "feat: add security settings page with 2FA enable/disable"
```

---

### Task 11: Add Email Verification Placeholder Page

**Files:**

- Create: `src/routes/(auth)/verify-email/+page.svelte`

- [ ] **Step 1: Create email verification page**

Create `src/routes/(auth)/verify-email/+page.svelte`:

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Check your email</CardTitle>
		<CardDescription>
			We've sent a verification link to your email address. Click the link to verify your account.
		</CardDescription>
	</CardHeader>
	<CardContent>
		<p class="text-sm text-muted-foreground">
			Didn't receive an email? Check your spam folder or try again.
		</p>
	</CardContent>
	<CardFooter class="justify-center">
		<Button href="/login" variant="outline">Back to sign in</Button>
	</CardFooter>
</Card>
```

- [ ] **Step 2: Commit**

```bash
cd D:/2026/bokeros
git add "src/routes/(auth)/verify-email/"
git commit -m "feat: add email verification placeholder page"
```

---

### Task 12: Final Verification

**Files:**

- No new files — verification only

- [ ] **Step 1: Run type check**

```bash
cd D:/2026/bokeros
pnpm check
```

Expected: 0 errors

- [ ] **Step 2: Run lint**

```bash
cd D:/2026/bokeros
pnpm lint
```

Expected: 0 errors. If formatting issues, run `pnpm format` then re-check.

- [ ] **Step 3: Start dev server and test auth flow**

```bash
cd D:/2026/bokeros
pnpm dev
```

Test:

1. Visit `/register` — form submits via POST (check network tab: form action, not fetch to /api/auth)
2. Visit `/login` — form submits via POST
3. Visit `/forgot-password` — form submits via POST, always shows success
4. Visit `/settings/security` — shows 2FA enable option
5. Visit `/banned` — shows suspended page
6. Visit `/two-factor` — shows TOTP input
7. Visit `/accept-invitation/fake-id` — redirects to login if not authenticated

- [ ] **Step 4: Format and commit any remaining changes**

```bash
cd D:/2026/bokeros
pnpm format
git add -A
git diff --cached --stat
# If there are changes:
git commit -m "chore: format and fix any remaining lint issues"
```
