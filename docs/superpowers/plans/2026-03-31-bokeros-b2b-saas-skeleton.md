# Bokeros B2B SaaS Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a production-ready B2B SaaS skeleton with SvelteKit 2, Svelte 5, PostgreSQL 17, Better Auth, Tailwind CSS v4, shadcn-svelte, and Drizzle ORM.

**Architecture:** Single SvelteKit monolith (Node adapter) connecting to PostgreSQL via Drizzle ORM. Better Auth handles authentication via SvelteKit hooks middleware. Organization-based multi-tenancy with roles.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), PostgreSQL 17, Drizzle ORM (postgres-js driver), Better Auth (organization plugin), Tailwind CSS v4, shadcn-svelte, pnpm

---

## File Structure

```
bokeros/
├── docker-compose.yml
├── drizzle.config.ts
├── .env
├── .env.example
├── .gitignore
├── components.json                  (shadcn-svelte config)
├── package.json
├── pnpm-lock.yaml
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── app.css                      (Tailwind CSS v4 entry)
│   ├── app.d.ts                     (App.Locals type declarations)
│   ├── app.html                     (HTML shell)
│   ├── hooks.server.ts              (Better Auth handler + session population)
│   ├── lib/
│   │   ├── auth-client.ts           (Better Auth client for Svelte)
│   │   ├── utils.ts                 (cn utility from shadcn-svelte)
│   │   ├── server/
│   │   │   ├── auth.ts              (Better Auth server instance)
│   │   │   └── db/
│   │   │       ├── index.ts         (Drizzle client)
│   │   │       └── schema.ts        (Drizzle schema — Better Auth tables)
│   │   └── components/
│   │       ├── ui/                  (shadcn-svelte components — added via CLI)
│   │       └── layout/
│   │           ├── app-sidebar.svelte
│   │           ├── app-header.svelte
│   │           └── user-menu.svelte
│   └── routes/
│       ├── +layout.svelte           (root layout — imports app.css)
│       ├── +layout.server.ts        (root layout — passes session to all pages)
│       ├── (marketing)/
│       │   ├── +layout.svelte       (marketing nav + footer)
│       │   └── +page.svelte         (landing page)
│       ├── (auth)/
│       │   ├── +layout.svelte       (minimal auth layout)
│       │   ├── +layout.server.ts    (redirect to /dashboard if logged in)
│       │   ├── login/+page.svelte
│       │   ├── register/+page.svelte
│       │   └── forgot-password/+page.svelte
│       └── (app)/
│           ├── +layout.server.ts    (auth guard — redirect to /login)
│           ├── +layout.svelte       (sidebar + header shell)
│           ├── dashboard/+page.svelte
│           └── settings/
│               ├── +layout.svelte   (settings sub-nav)
│               ├── profile/+page.svelte
│               ├── profile/+page.server.ts
│               ├── organization/+page.svelte
│               ├── organization/+page.server.ts
│               ├── members/+page.svelte
│               └── members/+page.server.ts
└── drizzle/                         (generated migrations)
```

---

### Task 1: Scaffold SvelteKit Project

**Files:**

- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/routes/+page.svelte`

- [ ] **Step 1: Create SvelteKit project**

Run from inside `D:/2026/bokeros`:

```bash
cd D:/2026/bokeros
pnpm dlx sv create . --template minimal --types ts --add eslint,prettier,vitest --no-dir-check --install pnpm
```

Select defaults if prompted. This creates the SvelteKit skeleton with TypeScript, ESLint, Prettier, and Vitest.

- [ ] **Step 2: Install Node adapter**

```bash
cd D:/2026/bokeros
pnpm add -D @sveltejs/adapter-node
```

- [ ] **Step 3: Configure Node adapter**

Edit `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

- [ ] **Step 4: Verify dev server starts**

```bash
cd D:/2026/bokeros
pnpm dev
```

Expected: Dev server starts at `http://localhost:5173`. Stop it after confirming.

- [ ] **Step 5: Initialize git and commit**

```bash
cd D:/2026/bokeros
git init
git add -A
git commit -m "chore: scaffold SvelteKit project with TypeScript, ESLint, Prettier, Vitest"
```

---

### Task 2: Set Up Tailwind CSS v4 + shadcn-svelte

**Files:**

- Create: `src/app.css`, `components.json`, `src/lib/utils.ts`
- Modify: `vite.config.ts`, `src/routes/+layout.svelte`

- [ ] **Step 1: Add Tailwind CSS v4 (if not already added by sv create)**

Check if `@tailwindcss/vite` is in `package.json`. If not:

```bash
cd D:/2026/bokeros
pnpm add -D @tailwindcss/vite tailwindcss
```

Ensure `vite.config.ts` has the Tailwind plugin:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
```

- [ ] **Step 2: Initialize shadcn-svelte**

```bash
cd D:/2026/bokeros
pnpm dlx shadcn-svelte@latest init --base-color slate --css src/app.css --no-deps
```

This creates `components.json` and configures `src/app.css` with the full Tailwind v4 theme (CSS variables, `@theme inline` block, dark mode support).

Then install dependencies that shadcn-svelte needs:

```bash
pnpm add tailwind-variants clsx tailwind-merge tw-animate-css bits-ui
pnpm add @lucide/svelte
```

- [ ] **Step 3: Set up root layout to import CSS**

Edit `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children?.()}
```

- [ ] **Step 4: Add initial shadcn-svelte components**

```bash
cd D:/2026/bokeros
pnpm dlx shadcn-svelte@latest add button card input label separator avatar badge dropdown-menu dialog table sidebar -y
```

- [ ] **Step 5: Verify Tailwind + components work**

Edit `src/routes/+page.svelte` temporarily:

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex items-center justify-center min-h-screen">
	<Button>It works!</Button>
</div>
```

Run `pnpm dev` and verify the styled button renders at `http://localhost:5173`. Then revert the page.

- [ ] **Step 6: Commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: add Tailwind CSS v4 and shadcn-svelte with initial components"
```

---

### Task 3: Set Up PostgreSQL + Docker Compose + Drizzle ORM

**Files:**

- Create: `docker-compose.yml`, `.env`, `.env.example`, `drizzle.config.ts`, `src/lib/server/db/index.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create Docker Compose for PostgreSQL**

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: bokeros
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 2: Create environment files**

Create `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bokeros
BETTER_AUTH_SECRET=dev-secret-change-in-production-min-32-chars!!
BETTER_AUTH_URL=http://localhost:5173
```

Create `.env.example`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bokeros
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:5173
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
```

- [ ] **Step 3: Update .gitignore**

Append to `.gitignore`:

```
.env
.superpowers/
```

- [ ] **Step 4: Install Drizzle ORM with postgres-js driver**

```bash
cd D:/2026/bokeros
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

- [ ] **Step 5: Create Drizzle client**

Create `src/lib/server/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';
import * as schema from './schema';

const client = postgres(DATABASE_URL);
export const db = drizzle({ client, schema });
```

- [ ] **Step 6: Create placeholder schema file**

Create `src/lib/server/db/schema.ts`:

```ts
// Better Auth will generate tables here via `npx @better-auth/cli generate`
// Custom application tables are added below the generated content
```

- [ ] **Step 7: Create Drizzle config**

Create `drizzle.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
});
```

- [ ] **Step 8: Install dotenv for drizzle-kit CLI**

```bash
cd D:/2026/bokeros
pnpm add -D dotenv
```

- [ ] **Step 9: Start PostgreSQL and verify connection**

```bash
cd D:/2026/bokeros
docker compose up -d
```

Wait a moment for Postgres to initialize, then verify:

```bash
docker compose exec postgres psql -U postgres -d bokeros -c "SELECT 1;"
```

Expected: Returns a row with `1`.

- [ ] **Step 10: Commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: add PostgreSQL via Docker Compose and Drizzle ORM configuration"
```

---

### Task 4: Configure Better Auth

**Files:**

- Create: `src/lib/server/auth.ts`, `src/lib/auth-client.ts`, `src/hooks.server.ts`, `src/app.d.ts`
- Modify: `src/lib/server/db/schema.ts`

- [ ] **Step 1: Install Better Auth**

```bash
cd D:/2026/bokeros
pnpm add better-auth
```

- [ ] **Step 2: Create Better Auth server instance**

Create `src/lib/server/auth.ts`:

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { db } from './db';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: true
	},
	plugins: [
		organization({
			allowUserToCreateOrganization: true,
			organizationLimit: 5,
			creatorRole: 'owner',
			membershipLimit: 50
		})
	],
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60
		}
	}
});

export type Session = typeof auth.$Infer.Session;
```

- [ ] **Step 3: Generate Better Auth schema for Drizzle**

```bash
cd D:/2026/bokeros
pnpm dlx @better-auth/cli generate --config src/lib/server/auth.ts --output src/lib/server/db/schema.ts
```

This generates the Drizzle table definitions for `user`, `session`, `account`, `verification`, `organization`, `member`, and `invitation` tables.

If the CLI doesn't work due to SvelteKit path aliases, create a temporary generation script. In that case, check the generated output and manually create the schema. The expected tables are:

```ts
import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	activeOrganizationId: text('active_organization_id')
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const organization = pgTable('organization', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').unique(),
	logo: text('logo'),
	createdAt: timestamp('created_at').notNull(),
	metadata: text('metadata')
});

export const member = pgTable('member', {
	id: text('id').primaryKey(),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	role: text('role').notNull(),
	createdAt: timestamp('created_at').notNull()
});

export const invitation = pgTable('invitation', {
	id: text('id').primaryKey(),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id),
	email: text('email').notNull(),
	role: text('role'),
	status: text('status').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	inviterId: text('inviter_id')
		.notNull()
		.references(() => user.id)
});
```

- [ ] **Step 4: Push schema to database**

```bash
cd D:/2026/bokeros
pnpm drizzle-kit push
```

Expected: Tables created in PostgreSQL. Confirm with:

```bash
docker compose exec postgres psql -U postgres -d bokeros -c "\dt"
```

Should show: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`.

- [ ] **Step 5: Create SvelteKit hooks for Better Auth**

Create `src/hooks.server.ts`:

```ts
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = session?.session ?? null;
	event.locals.user = session?.user ?? null;

	return svelteKitHandler({ event, resolve, auth });
};
```

- [ ] **Step 6: Create type declarations**

Create `src/app.d.ts`:

```ts
import type { Session } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			session: Session['session'] | null;
			user: Session['user'] | null;
		}
	}
}

export {};
```

- [ ] **Step 7: Create Better Auth client**

Create `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from 'better-auth/svelte';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [organizationClient()]
});
```

- [ ] **Step 8: Verify auth setup**

```bash
cd D:/2026/bokeros
pnpm dev
```

Navigate to `http://localhost:5173`. The dev server should start without errors. Check the terminal for any import/config errors. Stop after confirming.

- [ ] **Step 9: Commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: configure Better Auth with organization plugin and Drizzle adapter"
```

---

### Task 5: Root Layout + Session Passing

**Files:**

- Create: `src/routes/+layout.server.ts`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Create root layout server load**

Create `src/routes/+layout.server.ts`:

```ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: locals.session,
		user: locals.user
	};
};
```

- [ ] **Step 2: Update root layout**

Edit `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children?.()}
```

This should already be correct from Task 2. Verify it imports `app.css` and renders children.

- [ ] **Step 3: Commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: add root layout with session data passing"
```

---

### Task 6: Auth Pages (Login, Register, Forgot Password)

**Files:**

- Create: `src/routes/(auth)/+layout.svelte`, `src/routes/(auth)/+layout.server.ts`, `src/routes/(auth)/login/+page.svelte`, `src/routes/(auth)/register/+page.svelte`, `src/routes/(auth)/forgot-password/+page.svelte`

- [ ] **Step 1: Create auth layout server — redirect if logged in**

Create `src/routes/(auth)/+layout.server.ts`:

```ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
};
```

- [ ] **Step 2: Create auth layout**

Create `src/routes/(auth)/+layout.svelte`:

```svelte
<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="w-full max-w-md px-4">
		{@render children?.()}
	</div>
</div>
```

- [ ] **Step 3: Create login page**

Create `src/routes/(auth)/login/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin() {
		loading = true;
		error = '';
		const { error: authError } = await authClient.signIn.email({
			email,
			password
		});
		if (authError) {
			error = authError.message ?? 'Failed to sign in';
			loading = false;
		} else {
			goto('/dashboard');
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="text-2xl">Sign in</Card.Title>
		<Card.Description>Enter your credentials to access your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleLogin} class="grid gap-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			{/if}
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" placeholder="you@example.com" bind:value={email} required />
			</div>
			<div class="grid gap-2">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>
					<a href="/forgot-password" class="text-sm text-muted-foreground hover:underline">
						Forgot password?
					</a>
				</div>
				<Input id="password" type="password" bind:value={password} required />
			</div>
			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Signing in...' : 'Sign in'}
			</Button>
		</form>
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			Don't have an account? <a href="/register" class="text-primary hover:underline">Sign up</a>
		</p>
	</Card.Footer>
</Card.Root>
```

- [ ] **Step 4: Create register page**

Create `src/routes/(auth)/register/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleRegister() {
		loading = true;
		error = '';
		const { error: authError } = await authClient.signUp.email({
			name,
			email,
			password
		});
		if (authError) {
			error = authError.message ?? 'Failed to create account';
			loading = false;
		} else {
			goto('/dashboard');
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="text-2xl">Create account</Card.Title>
		<Card.Description>Enter your details to get started</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleRegister} class="grid gap-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			{/if}
			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input id="name" type="text" placeholder="Your name" bind:value={name} required />
			</div>
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" placeholder="you@example.com" bind:value={email} required />
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					type="password"
					placeholder="Min 8 characters"
					bind:value={password}
					required
					minlength={8}
				/>
			</div>
			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Creating account...' : 'Create account'}
			</Button>
		</form>
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			Already have an account? <a href="/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</Card.Footer>
</Card.Root>
```

- [ ] **Step 5: Create forgot password page**

Create `src/routes/(auth)/forgot-password/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleReset() {
		loading = true;
		error = '';
		const { error: authError } = await authClient.forgetPassword({
			email,
			redirectTo: '/login'
		});
		if (authError) {
			error = authError.message ?? 'Failed to send reset email';
		} else {
			success = true;
		}
		loading = false;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="text-2xl">Reset password</Card.Title>
		<Card.Description>Enter your email to receive a reset link</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if success}
			<div class="rounded-md bg-primary/10 p-4 text-sm text-primary">
				If an account exists for {email}, you'll receive a password reset link.
			</div>
		{:else}
			<form onsubmit={handleReset} class="grid gap-4">
				{#if error}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
				{/if}
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						bind:value={email}
						required
					/>
				</div>
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Sending...' : 'Send reset link'}
				</Button>
			</form>
		{/if}
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			<a href="/login" class="text-primary hover:underline">Back to sign in</a>
		</p>
	</Card.Footer>
</Card.Root>
```

- [ ] **Step 6: Verify auth pages render**

```bash
cd D:/2026/bokeros
pnpm dev
```

Navigate to `http://localhost:5173/login`, `/register`, `/forgot-password`. Verify each page renders with styled card forms.

- [ ] **Step 7: Commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: add auth pages — login, register, forgot password"
```

---

### Task 7: App Shell (Auth Guard, Sidebar, Header)

**Files:**

- Create: `src/routes/(app)/+layout.server.ts`, `src/routes/(app)/+layout.svelte`, `src/lib/components/layout/app-sidebar.svelte`, `src/lib/components/layout/app-header.svelte`, `src/lib/components/layout/user-menu.svelte`

- [ ] **Step 1: Create app layout auth guard**

Create `src/routes/(app)/+layout.server.ts`:

```ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/login');
	}
	return {
		user: locals.user,
		session: locals.session
	};
};
```

- [ ] **Step 2: Create user menu component**

Create `src/lib/components/layout/user-menu.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	let { user }: { user: { name: string; email: string; image?: string | null } } = $props();

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	async function handleSignOut() {
		await authClient.signOut();
		goto('/login');
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Avatar class="h-8 w-8 cursor-pointer">
			<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
		</Avatar>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Label>
			<div class="flex flex-col space-y-1">
				<p class="text-sm font-medium">{user.name}</p>
				<p class="text-xs text-muted-foreground">{user.email}</p>
			</div>
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Item href="/settings/profile">Profile</DropdownMenu.Item>
		<DropdownMenu.Item href="/settings/organization">Organization</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={handleSignOut}>Sign out</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
```

- [ ] **Step 3: Create app sidebar component**

Create `src/lib/components/layout/app-sidebar.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Settings from '@lucide/svelte/icons/settings';
	import Users from '@lucide/svelte/icons/users';
	import Building2 from '@lucide/svelte/icons/building-2';
	import UserIcon from '@lucide/svelte/icons/user';

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/settings/profile', label: 'Profile', icon: UserIcon },
		{ href: '/settings/organization', label: 'Organization', icon: Building2 },
		{ href: '/settings/members', label: 'Members', icon: Users }
	];
</script>

<Sidebar.Root>
	<Sidebar.Header class="border-b px-4 py-3">
		<a href="/dashboard" class="text-lg font-semibold">Bokeros</a>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each navItems as item}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton href={item.href} isActive={page.url.pathname === item.href}>
								<item.icon class="h-4 w-4" />
								<span>{item.label}</span>
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
```

- [ ] **Step 4: Create app header component**

Create `src/lib/components/layout/app-header.svelte`:

```svelte
<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger } from '$lib/components/ui/sidebar';
	import UserMenu from './user-menu.svelte';

	let { user }: { user: { name: string; email: string; image?: string | null } } = $props();
</script>

<header class="flex h-14 items-center gap-4 border-b px-4">
	<SidebarTrigger />
	<Separator orientation="vertical" class="h-6" />
	<div class="flex-1" />
	<UserMenu {user} />
</header>
```

- [ ] **Step 5: Create app layout**

Create `src/routes/(app)/+layout.svelte`:

```svelte
<script lang="ts">
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';
	import AppHeader from '$lib/components/layout/app-header.svelte';

	let { data, children } = $props();
</script>

<SidebarProvider>
	<AppSidebar />
	<SidebarInset>
		<AppHeader user={data.user} />
		<main class="flex-1 p-6">
			{@render children?.()}
		</main>
	</SidebarInset>
</SidebarProvider>
```

- [ ] **Step 6: Create dashboard page**

Create `src/routes/(app)/dashboard/+page.svelte`:

```svelte
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
</script>

<div class="space-y-6">
	<h1 class="text-3xl font-bold">Dashboard</h1>
	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Description>Total Members</Card.Description>
				<Card.Title class="text-2xl">0</Card.Title>
			</Card.Header>
		</Card.Root>
		<Card.Root>
			<Card.Header>
				<Card.Description>Active Projects</Card.Description>
				<Card.Title class="text-2xl">0</Card.Title>
			</Card.Header>
		</Card.Root>
		<Card.Root>
			<Card.Header>
				<Card.Description>Pending Invites</Card.Description>
				<Card.Title class="text-2xl">0</Card.Title>
			</Card.Header>
		</Card.Root>
	</div>
</div>
```

- [ ] **Step 7: Verify app shell**

```bash
cd D:/2026/bokeros
pnpm dev
```

Navigate to `http://localhost:5173/dashboard`. Since you're not logged in, it should redirect to `/login`. Register a new account, then verify the dashboard loads with the sidebar and header.

- [ ] **Step 8: Commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: add app shell with sidebar, header, auth guard, and dashboard"
```

---

### Task 8: Settings Pages

**Files:**

- Create: `src/routes/(app)/settings/+layout.svelte`, `src/routes/(app)/settings/profile/+page.svelte`, `src/routes/(app)/settings/profile/+page.server.ts`, `src/routes/(app)/settings/organization/+page.svelte`, `src/routes/(app)/settings/organization/+page.server.ts`, `src/routes/(app)/settings/members/+page.svelte`, `src/routes/(app)/settings/members/+page.server.ts`

- [ ] **Step 1: Create settings layout with sub-nav**

Create `src/routes/(app)/settings/+layout.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';

	let { children } = $props();

	const tabs = [
		{ href: '/settings/profile', label: 'Profile' },
		{ href: '/settings/organization', label: 'Organization' },
		{ href: '/settings/members', label: 'Members' }
	];
</script>

<div class="space-y-6">
	<h1 class="text-3xl font-bold">Settings</h1>
	<nav class="flex gap-2 border-b pb-2">
		{#each tabs as tab}
			<Button
				variant={page.url.pathname === tab.href ? 'secondary' : 'ghost'}
				size="sm"
				href={tab.href}
			>
				{tab.label}
			</Button>
		{/each}
	</nav>
	{@render children?.()}
</div>
```

- [ ] **Step 2: Create profile settings page**

Create `src/routes/(app)/settings/profile/+page.server.ts`:

```ts
import { auth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: locals.user!
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name is required' });
		}

		await auth.api.updateUser({
			headers: request.headers,
			body: { name: name.trim() }
		});

		return { success: true };
	}
};
```

Create `src/routes/(app)/settings/profile/+page.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';

	let { data, form } = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Profile</Card.Title>
		<Card.Description>Manage your personal information</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance class="grid gap-4 max-w-md">
			{#if form?.error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{form.error}</div>
			{/if}
			{#if form?.success}
				<div class="rounded-md bg-primary/10 p-3 text-sm text-primary">Profile updated.</div>
			{/if}
			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input id="name" name="name" value={data.user.name} required />
			</div>
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" value={data.user.email} disabled />
				<p class="text-xs text-muted-foreground">Email cannot be changed</p>
			</div>
			<Button type="submit" class="w-fit">Save changes</Button>
		</form>
	</Card.Content>
</Card.Root>
```

- [ ] **Step 3: Create organization settings page**

Create `src/routes/(app)/settings/organization/+page.server.ts`:

```ts
import { auth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session?.activeOrganizationId) {
		return { organization: null };
	}

	const org = await auth.api.getFullOrganization({
		headers: new Headers(),
		query: { organizationId: locals.session.activeOrganizationId }
	});

	return { organization: org };
};
```

Create `src/routes/(app)/settings/organization/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';

	let { data } = $props();
	let orgName = $state('');
	let orgSlug = $state('');
	let loading = $state(false);
	let error = $state('');

	async function createOrg() {
		loading = true;
		error = '';
		const { error: authError } = await authClient.organization.create({
			name: orgName,
			slug: orgSlug
		});
		if (authError) {
			error = authError.message ?? 'Failed to create organization';
		} else {
			await invalidateAll();
		}
		loading = false;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Organization</Card.Title>
		<Card.Description>Manage your organization settings</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if data.organization}
			<div class="grid gap-4 max-w-md">
				<div class="grid gap-2">
					<Label>Name</Label>
					<Input value={data.organization.name} disabled />
				</div>
				<div class="grid gap-2">
					<Label>Slug</Label>
					<Input value={data.organization.slug ?? ''} disabled />
				</div>
			</div>
		{:else}
			<form onsubmit={createOrg} class="grid gap-4 max-w-md">
				{#if error}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
				{/if}
				<p class="text-sm text-muted-foreground">
					You don't have an organization yet. Create one to get started.
				</p>
				<div class="grid gap-2">
					<Label for="orgName">Organization name</Label>
					<Input id="orgName" bind:value={orgName} required />
				</div>
				<div class="grid gap-2">
					<Label for="orgSlug">Slug</Label>
					<Input id="orgSlug" bind:value={orgSlug} placeholder="my-org" required />
				</div>
				<Button type="submit" class="w-fit" disabled={loading}>
					{loading ? 'Creating...' : 'Create organization'}
				</Button>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
```

- [ ] **Step 4: Create members settings page**

Create `src/routes/(app)/settings/members/+page.server.ts`:

```ts
import { auth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session?.activeOrganizationId) {
		return { members: [], invitations: [] };
	}

	const org = await auth.api.getFullOrganization({
		headers: new Headers(),
		query: { organizationId: locals.session.activeOrganizationId }
	});

	return {
		members: org?.members ?? [],
		invitations: org?.invitations ?? []
	};
};
```

Create `src/routes/(app)/settings/members/+page.svelte`:

```svelte
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';

	let { data } = $props();
	let inviteEmail = $state('');
	let inviteRole = $state('member');
	let loading = $state(false);
	let error = $state('');

	async function handleInvite() {
		loading = true;
		error = '';
		const { error: authError } = await authClient.organization.inviteMember({
			email: inviteEmail,
			role: inviteRole as 'member' | 'admin'
		});
		if (authError) {
			error = authError.message ?? 'Failed to send invitation';
		} else {
			inviteEmail = '';
			await invalidateAll();
		}
		loading = false;
	}
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Members</Card.Title>
			<Card.Description>Manage your team members</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.members.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Email</Table.Head>
							<Table.Head>Role</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.members as member}
							<Table.Row>
								<Table.Cell>{member.user.name}</Table.Cell>
								<Table.Cell>{member.user.email}</Table.Cell>
								<Table.Cell><Badge variant="secondary">{member.role}</Badge></Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<p class="text-sm text-muted-foreground">No members yet. Create an organization first.</p>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if data.members.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Invite member</Card.Title>
				<Card.Description>Send an invitation to join your organization</Card.Description>
			</Card.Header>
			<Card.Content>
				<form onsubmit={handleInvite} class="flex gap-4 items-end max-w-lg">
					{#if error}
						<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive w-full">
							{error}
						</div>
					{/if}
					<div class="grid gap-2 flex-1">
						<Label for="inviteEmail">Email</Label>
						<Input
							id="inviteEmail"
							type="email"
							bind:value={inviteEmail}
							placeholder="colleague@company.com"
							required
						/>
					</div>
					<Button type="submit" disabled={loading}>
						{loading ? 'Sending...' : 'Send invite'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
```

- [ ] **Step 5: Verify settings pages**

```bash
cd D:/2026/bokeros
pnpm dev
```

Log in and navigate to `/settings/profile`, `/settings/organization`, `/settings/members`. Verify each page renders with proper layout and sub-navigation.

- [ ] **Step 6: Commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: add settings pages — profile, organization, members"
```

---

### Task 9: Marketing Landing Page

**Files:**

- Create: `src/routes/(marketing)/+layout.svelte`, `src/routes/(marketing)/+page.svelte`
- Remove: `src/routes/+page.svelte` (the default SvelteKit page)

- [ ] **Step 1: Remove default SvelteKit page**

Delete `src/routes/+page.svelte` (the scaffolded default).

- [ ] **Step 2: Create marketing layout**

Create `src/routes/(marketing)/+layout.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header class="border-b">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<a href="/" class="text-xl font-bold">Bokeros</a>
			<nav class="flex items-center gap-4">
				{#if data.user}
					<Button href="/dashboard" variant="default">Dashboard</Button>
				{:else}
					<Button href="/login" variant="ghost">Sign in</Button>
					<Button href="/register">Get started</Button>
				{/if}
			</nav>
		</div>
	</header>

	<main class="flex-1">
		{@render children?.()}
	</main>

	<footer class="border-t py-8">
		<div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
			&copy; {new Date().getFullYear()} Bokeros. All rights reserved.
		</div>
	</footer>
</div>
```

- [ ] **Step 3: Create landing page**

Create `src/routes/(marketing)/+page.svelte`:

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<section class="container mx-auto px-4 py-24 text-center">
	<h1 class="text-5xl font-bold tracking-tight sm:text-6xl">
		Build your business<br />with <span class="text-primary">Bokeros</span>
	</h1>
	<p class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
		The modern B2B platform that helps teams collaborate, manage organizations, and scale their
		operations.
	</p>
	<div class="mt-10 flex justify-center gap-4">
		<Button href="/register" size="lg">Get started free</Button>
		<Button href="/login" variant="outline" size="lg">Sign in</Button>
	</div>
</section>

<section class="border-t bg-muted/50 py-24">
	<div class="container mx-auto grid gap-8 px-4 md:grid-cols-3">
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Team Management</h3>
			<p class="text-muted-foreground">
				Invite members, assign roles, and manage your organization with ease.
			</p>
		</div>
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Secure by Default</h3>
			<p class="text-muted-foreground">
				Enterprise-grade authentication with session management and role-based access.
			</p>
		</div>
		<div class="space-y-2">
			<h3 class="text-xl font-semibold">Built to Scale</h3>
			<p class="text-muted-foreground">
				Multi-tenant architecture designed for growing teams and organizations.
			</p>
		</div>
	</div>
</section>
```

- [ ] **Step 4: Verify landing page**

```bash
cd D:/2026/bokeros
pnpm dev
```

Navigate to `http://localhost:5173/`. Verify the marketing landing page renders with header, hero section, features section, and footer. The header should show "Sign in" / "Get started" when logged out, or "Dashboard" when logged in.

- [ ] **Step 5: Commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: add marketing landing page with header and footer"
```

---

### Task 10: Final Wiring + Cleanup

**Files:**

- Create: `.env.example` (verify), `CLAUDE.md`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Add convenience scripts to package.json**

Add to the `"scripts"` section of `package.json`:

```json
{
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
		"lint": "prettier --check . && eslint .",
		"format": "prettier --write .",
		"test": "vitest",
		"db:push": "drizzle-kit push",
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate",
		"db:studio": "drizzle-kit studio"
	}
}
```

- [ ] **Step 2: Create CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# Bokeros

B2B SaaS skeleton built with SvelteKit 2, Svelte 5, PostgreSQL 17, Better Auth, Tailwind CSS v4, shadcn-svelte, and Drizzle ORM.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm check` — type check
- `pnpm lint` — lint and format check
- `pnpm format` — auto-format
- `pnpm test` — run tests
- `pnpm db:push` — push schema to database
- `pnpm db:generate` — generate migrations
- `pnpm db:migrate` — run migrations
- `docker compose up -d` — start PostgreSQL

## Architecture

- Single SvelteKit monolith with Node adapter
- Better Auth for authentication (organization plugin for multi-tenancy)
- Drizzle ORM with postgres-js driver for database access
- Route groups: `(marketing)` public, `(auth)` login/register, `(app)` authenticated
- Auth guard in `(app)/+layout.server.ts`
- Session populated in `hooks.server.ts` and available via `event.locals`

## Conventions

- Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)
- Server load functions for data fetching (`+page.server.ts`)
- Form actions for mutations (progressive enhancement)
- shadcn-svelte components in `src/lib/components/ui/`
- Custom layout components in `src/lib/components/layout/`
- Server-only code in `src/lib/server/`
```

- [ ] **Step 3: Verify full flow end-to-end**

```bash
cd D:/2026/bokeros
docker compose up -d
pnpm db:push
pnpm dev
```

Test the following flow:

1. Visit `http://localhost:5173/` — see landing page
2. Click "Get started" — go to register page
3. Register a new account — redirected to dashboard
4. See dashboard with sidebar and header
5. Navigate to Settings > Organization — create an org
6. Navigate to Settings > Members — see yourself as owner
7. Navigate to Settings > Profile — update your name
8. Sign out via user menu — redirected to login
9. Sign in again — back to dashboard

- [ ] **Step 4: Run checks**

```bash
cd D:/2026/bokeros
pnpm check
pnpm lint
```

Fix any type errors or lint issues.

- [ ] **Step 5: Final commit**

```bash
cd D:/2026/bokeros
git add -A
git commit -m "feat: add convenience scripts, CLAUDE.md, and finalize skeleton"
```
