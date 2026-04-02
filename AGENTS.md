# Agent Context — i60 SvelteKit + Better Auth Template

> Anti-hallucination reference for AI agents building on this template.
> Read by Claude Code, Cursor, Windsurf, and other AI coding tools.
> Always consult [better-auth.com/docs](https://better-auth.com/docs) for the latest Better Auth API.

---

## Version Reference

These are the **exact versions** this template uses. Generate code for THESE versions, not older docs.

| Package                | Version  | Role                                                  |
| ---------------------- | -------- | ----------------------------------------------------- |
| svelte                 | ^5.54.0  | UI framework (runes mode)                             |
| @sveltejs/kit          | ^2.50.2  | App framework (file-based routing)                    |
| better-auth            | ^1.5.6   | Authentication (server + client)                      |
| drizzle-orm            | ^0.45.2  | Type-safe ORM                                         |
| drizzle-kit            | ^0.31.10 | Migration tooling                                     |
| postgres               | ^3.4.8   | PostgreSQL driver (postgres.js)                       |
| tailwindcss            | ^4.2.2   | Utility CSS (CSS-first config, NO tailwind.config.js) |
| bits-ui                | ^2.16.3  | Headless UI primitives (used by shadcn-svelte)        |
| @lucide/svelte         | ^1.7.0   | Icons                                                 |
| @sveltejs/adapter-node | ^5.5.4   | Node.js deployment adapter                            |
| vite                   | ^7.3.1   | Build tool                                            |

---

## Architecture

Single SvelteKit 2 monolith with Node adapter. No separate API server.

- **Auth**: Better Auth mounted at `/api/auth/*` via `hooks.server.ts`
- **Database**: PostgreSQL 17, Drizzle ORM with postgres.js driver
- **Email**: Pluggable provider via `EMAIL_PROVIDER` env var
- **UI**: Tailwind CSS v4 + shadcn-svelte components
- **Session**: Populated in `hooks.server.ts`, available as `event.locals.session` / `event.locals.user` in all server code

### Route Groups

| Group                    | Purpose                                                                                 | Auth                                             |
| ------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `(marketing)`            | Public pages — landing                                                                  | No                                               |
| `(auth)`                 | Auth flows — login, register, forgot-password, reset-password, verify-email, two-factor | No (redirects to `/dashboard` if logged in)      |
| `(app)`                  | App pages — dashboard, settings                                                         | Yes (redirects to `/login` if not authenticated) |
| `accept-invitation/[id]` | Org invitation accept/reject                                                            | Yes (standalone)                                 |
| `banned`                 | Suspended account page                                                                  | No guard                                         |

### Data Flow

```
hooks.server.ts          → populates event.locals.session / event.locals.user
+layout.server.ts (root) → passes session/user to all pages
+layout.server.ts (group) → group-specific guards and data
+page.server.ts           → page-specific load + form actions
+page.svelte              → receives data via $props(), uses form actions or authClient
```

---

## Key Files

| File                                            | Purpose                                                                                 | When to Modify                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/config.ts`                             | `APP_NAME`, `APP_DESCRIPTION`                                                           | First thing — set your app identity                                    |
| `src/lib/server/auth.ts`                        | Better Auth server config — plugins, roles, access control, rate limits, email handlers | Adding auth plugins, changing roles/permissions, adjusting rate limits |
| `src/lib/auth-client.ts`                        | Better Auth client — plugins must mirror server                                         | Adding client-side auth plugins                                        |
| `src/lib/server/email.ts`                       | Email abstraction — `sendEmail()` routes to configured provider                         | Adding email providers or changing email logic                         |
| `src/lib/server/db/schema.ts`                   | Drizzle schema — all database tables                                                    | Adding business domain tables                                          |
| `src/lib/server/db/index.ts`                    | Drizzle client instance (`db`)                                                          | Rarely — only if changing connection config                            |
| `src/hooks.server.ts`                           | Session population, banned user enforcement, Better Auth handler                        | Adding global middleware logic                                         |
| `src/app.d.ts`                                  | TypeScript types for `App.Locals`                                                       | Adding custom fields to locals                                         |
| `src/app.css`                                   | Tailwind imports, theme CSS variables (OKLch colors)                                    | Changing color scheme or adding custom utilities                       |
| `src/lib/components/layout/app-sidebar.svelte`  | Sidebar navigation items                                                                | Adding/removing nav links                                              |
| `src/lib/components/layout/user-menu.svelte`    | Avatar dropdown menu                                                                    | Adding user menu items                                                 |
| `src/lib/components/layout/theme-toggle.svelte` | Dark mode toggle (sun/moon icon)                                                        | Changing theme behavior or adding more themes                          |
| `src/app.html`                                  | HTML shell with dark mode FOUC prevention script                                        | Adding meta tags or changing the dark mode init script                 |

---

## Better Auth API Reference

### Server-Side API (`auth.api.*`)

Called from `+page.server.ts` form actions and load functions. Always pass `headers: request.headers` for cookie forwarding.

```ts
// Pattern for all server-side calls:
import { auth } from '$lib/server/auth';

// In form actions:
await auth.api.methodName({
  headers: request.headers,
  body: { ... }
});

// In load functions (GET-style):
await auth.api.methodName({
  headers: request.headers,
  query: { ... }
});
```

| Method                            | Body / Query                      | Returns                                  | Used In                             |
| --------------------------------- | --------------------------------- | ---------------------------------------- | ----------------------------------- |
| `auth.api.getSession()`           | headers only                      | `{ session, user }` or `null`            | `hooks.server.ts`                   |
| `auth.api.signInEmail()`          | `body: { email, password }`       | Session or `{ twoFactorRedirect: true }` | `login/+page.server.ts`             |
| `auth.api.signUpEmail()`          | `body: { name, email, password }` | User + Session                           | `register/+page.server.ts`          |
| `auth.api.requestPasswordReset()` | `body: { email, redirectTo? }`    | `{ status }`                             | `forgot-password/+page.server.ts`   |
| `auth.api.resetPassword()`        | `body: { newPassword, token }`    | `{ status }`                             | `reset-password/+page.server.ts`    |
| `auth.api.updateUser()`           | `body: { name?, image? }`         | `{ status }`                             | `settings/profile/+page.server.ts`  |
| `auth.api.getFullOrganization()`  | `query: { organizationId }`       | Org + members + invitations              | `settings/+layout.server.ts`        |
| `auth.api.acceptInvitation()`     | `body: { invitationId }`          | void                                     | `accept-invitation/+page.server.ts` |
| `auth.api.rejectInvitation()`     | `body: { invitationId }`          | void                                     | `accept-invitation/+page.server.ts` |

### Client-Side API (`authClient.*`)

Called from `.svelte` files. These make fetch requests to `/api/auth/*` endpoints.

```ts
import { authClient } from '$lib/auth-client';
```

| Method                                      | Parameters                                               | Used In                   |
| ------------------------------------------- | -------------------------------------------------------- | ------------------------- |
| `authClient.signIn.social()`                | `{ provider, callbackURL }`                              | login, register           |
| `authClient.signOut()`                      | none                                                     | user-menu, banned page    |
| `authClient.changePassword()`               | `{ currentPassword, newPassword, revokeOtherSessions? }` | security settings         |
| `authClient.twoFactor.enable()`             | `{ password }`                                           | security settings         |
| `authClient.twoFactor.disable()`            | `{ password }`                                           | security settings         |
| `authClient.twoFactor.getTotpUri()`         | `{ password }`                                           | security settings         |
| `authClient.twoFactor.verifyTotp()`         | `{ code, trustDevice? }`                                 | two-factor page, security |
| `authClient.twoFactor.verifyBackupCode()`   | `{ code }`                                               | two-factor page           |
| `authClient.organization.create()`          | `{ name, slug }`                                         | organization settings     |
| `authClient.organization.inviteMember()`    | `{ email, role }`                                        | members settings          |
| `authClient.emailOtp.verifyEmail()`         | `{ email, otp }`                                         | verify-email page         |
| `authClient.emailOtp.sendVerificationOtp()` | `{ email, type }`                                        | verify-email page         |

### Plugin Configuration (Server)

All plugins are configured in `src/lib/server/auth.ts`:

```ts
import { organization, admin, twoFactor, emailOTP } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
```

| Plugin                                    | Purpose                      | Key Config                               |
| ----------------------------------------- | ---------------------------- | ---------------------------------------- |
| `sveltekitCookies(getRequestEvent)`       | SvelteKit cookie integration | Required for SvelteKit                   |
| `organization({ ac, roles, ... })`        | Multi-tenant orgs            | 5 org limit, 50 members, 48h invitations |
| `admin({ defaultRole, adminRoles })`      | User management, banning     | Default role: "user"                     |
| `twoFactor({ issuer })`                   | TOTP + backup codes          | Issuer set to APP_NAME                   |
| `emailOTP({ otpLength, expiresIn, ... })` | Email verification codes     | 6 digits, 5 min expiry                   |

### Plugin Configuration (Client)

Must mirror server plugins. Configured in `src/lib/auth-client.ts`:

```ts
import {
	organizationClient,
	twoFactorClient,
	adminClient,
	emailOTPClient
} from 'better-auth/client/plugins';
```

### Email Verification Strategy

This template uses `emailOTP` for email verification instead of Better Auth's built-in `emailVerification.sendOnSignUp`. The relationship:

- `emailVerification.sendOnSignUp: false` — disables Better Auth's built-in verification email
- `emailOTP.sendVerificationOnSignUp: true` — sends a 6-digit OTP code instead

If you remove the `emailOTP` plugin, you must set `sendOnSignUp: true` and implement `emailVerification.sendVerificationEmail` to restore email verification.

### CSRF & Security Model

- **Form actions** (`+page.server.ts`) — Protected by SvelteKit's built-in CSRF check (validates `Origin` header). The `ORIGIN` env var must be set in production.
- **Client-side `authClient.*` calls** — Go to `/api/auth/*` which is handled by Better Auth's own middleware (not SvelteKit form actions). Better Auth has its own CSRF protection.
- **Rate limiting** — Applied by Better Auth at the `/api/auth/*` level. See `rateLimit.customRules` in `src/lib/server/auth.ts`.

---

## Auth Flows — Step by Step

### Email/Password Sign-Up

1. User fills form on `/register` → POST to form action
2. Action calls `auth.api.signUpEmail({ headers, body: { name, email, password } })`
3. Better Auth creates user, triggers `emailOTP.sendVerificationOTP` (sends OTP email)
4. Action redirects to `/verify-email?email=...`
5. User enters 6-digit OTP → client calls `authClient.emailOtp.verifyEmail({ email, otp })`
6. On success → client navigates to `/dashboard`

### Email/Password Sign-In

1. User fills form on `/login` → POST to form action
2. Action calls `auth.api.signInEmail({ headers, body: { email, password } })`
3. If 2FA enabled: returns `{ twoFactorRedirect: true }` → action redirects to `/two-factor`
4. If no 2FA: session created → action redirects to `/dashboard`

### Password Reset

1. User submits email on `/forgot-password` → POST to form action
2. Action calls `auth.api.requestPasswordReset({ headers, body: { email, redirectTo: '/reset-password' } })`
3. Better Auth generates token, calls `sendResetPassword({ user, url })` → sends email
4. User clicks email link → hits Better Auth's internal handler → redirects to `/reset-password?token=xxx`
5. User enters new password on `/reset-password` → POST to form action
6. Action calls `auth.api.resetPassword({ headers, body: { newPassword, token } })`
7. Redirects to `/login?reset=success`

### Two-Factor Authentication

**Setup (in security settings):**

1. User enters password → client calls `authClient.twoFactor.enable({ password })`
2. Client calls `authClient.twoFactor.getTotpUri({ password })` → displays TOTP URI
3. User scans with authenticator app, enters code → `authClient.twoFactor.verifyTotp({ code })`
4. Backup codes displayed → user saves them

**Verification (during sign-in):**

1. After sign-in redirects to `/two-factor`
2. User enters TOTP code → `authClient.twoFactor.verifyTotp({ code, trustDevice: true })`
3. Or enters backup code → `authClient.twoFactor.verifyBackupCode({ code })`
4. On success → navigates to `/dashboard`

### OAuth Sign-In

1. User clicks OAuth button → client calls `authClient.signIn.social({ provider, callbackURL: '/dashboard' })`
2. Redirects to provider (Google/GitHub/Microsoft)
3. Provider redirects back to `/api/auth/callback/{provider}`
4. Better Auth creates/links account, creates session
5. Redirects to `callbackURL` (`/dashboard`)

### Organization Invitation

1. Admin sends invite on `/settings/members` → `authClient.organization.inviteMember({ email, role })`
2. Better Auth calls `sendInvitationEmail` → sends email with link to `/accept-invitation/{id}`
3. Invitee clicks link → sees accept/reject form
4. Accept: form action calls `auth.api.acceptInvitation({ headers, body: { invitationId } })`
5. Reject: form action calls `auth.api.rejectInvitation({ headers, body: { invitationId } })`

---

## Svelte 5 Patterns

This template uses **Svelte 5 with runes mode enforced**. Do NOT use Svelte 4 syntax.

### DO — Correct Svelte 5 Patterns

```svelte
<!-- Reactive state -->
let count = $state(0);
let items = $state<string[]>([]);

<!-- Derived values -->
let doubled = $derived(count * 2);
let total = $derived(items.length);

<!-- Component props (typed from SvelteKit) -->
let { data, form }: PageProps = $props();
let { data, children }: LayoutProps = $props();

<!-- Custom component props -->
interface Props {
  user: { name: string; email: string };
}
let { user }: Props = $props();

<!-- Rendering children (replaces <slot>) -->
{@render children()}

<!-- Event handlers (attribute syntax) -->
<button onclick={handleClick}>
<input oninput={(e) => value = e.currentTarget.value}>

<!-- Conditional rendering -->
{#if condition}...{:else}...{/if}

<!-- List rendering -->
{#each items as item (item.id)}...{/each}

<!-- Snippet (named slot replacement) -->
{#snippet child({ props })}
  <a href={url} {...props}>Link</a>
{/snippet}
```

### DON'T — Svelte 4 Patterns That Will Break

```svelte
<!-- WRONG: export let (use $props()) -->
export let data;

<!-- WRONG: <slot> (use {@render children()}) -->
<slot />

<!-- WRONG: $: reactive declarations (use $derived) -->
$: doubled = count * 2;

<!-- WRONG: on: directive (use attribute syntax) -->
<button on:click={handleClick}>

<!-- WRONG: createEventDispatcher -->
import { createEventDispatcher } from 'svelte';

<!-- WRONG: writable/readable stores (use $state) -->
import { writable } from 'svelte/store';

<!-- WRONG: $store syntax -->
$myStore

<!-- WRONG: ComponentEvents / ComponentProps generics -->
```

---

## SvelteKit Patterns

### Import Aliases

```ts
import { ... } from '$lib/...'              // src/lib/
import { ... } from '$app/forms'            // enhance, deserialize, applyAction
import { ... } from '$app/navigation'       // goto, invalidateAll, afterNavigate
import { ... } from '$app/state'            // page (reactive page state)
import { ... } from '$app/environment'      // browser, building, dev, version
import { ... } from '$app/server'           // getRequestEvent (server only)
import { ... } from '$env/static/private'   // Server-only env vars
import { ... } from '$env/static/public'    // Client-safe env vars (PUBLIC_ prefix)
import type { PageProps } from './$types'   // Auto-generated page types
import type { LayoutProps } from './$types' // Auto-generated layout types
import type { PageServerLoad, Actions } from './$types'
```

### Server Load Functions

```ts
// +page.server.ts or +layout.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request, url, params }) => {
  // locals.user and locals.session are set in hooks.server.ts
  return { user: locals.user, someData: ... };
};
```

### Form Actions (Progressive Enhancement)

```ts
// +page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const value = formData.get('field') as string;
		if (!value) return fail(400, { error: 'Required' });
		// ... do work ...
		throw redirect(303, '/somewhere');
	}
};
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
	let submitting = $state(false);
</script>

<form
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update();
		};
	}}
>
	{#if form?.error}
		<div class="text-destructive">{form.error}</div>
	{/if}
	<!-- form fields -->
</form>
```

### Protected Routes

Auth guard is in `(app)/+layout.server.ts` — redirects to `/login` if no session. All routes inside `(app)` are automatically protected. The user/session is available via `data.user` / `data.session` in all `(app)` pages.

### Adding a New Protected Route

1. Create `src/routes/(app)/your-page/+page.svelte`
2. Optionally add `+page.server.ts` for data loading / form actions
3. Access `data.user` and `data.session` (inherited from `(app)/+layout.server.ts`)
4. Add nav item to `src/lib/components/layout/app-sidebar.svelte`

### Adding a New Public Route

1. Create `src/routes/(marketing)/your-page/+page.svelte`
2. No auth required — inherits from `(marketing)` layout

---

## Drizzle ORM Patterns

### Schema Definition

Tables are defined in `src/lib/server/db/schema.ts` using Drizzle's `pgTable`:

```ts
import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { user } from './schema'; // reference auth tables for FKs

export const project = pgTable('project', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	ownerId: text('owner_id')
		.notNull()
		.references(() => user.id),
	organizationId: text('organization_id').references(() => organization.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});
```

### Querying

```ts
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

// Select
const projects = await db.select().from(project).where(eq(project.ownerId, userId));

// Select with ordering and limit
const recent = await db.select().from(project).orderBy(desc(project.createdAt)).limit(10);

// Insert
const [newProject] = await db.insert(project).values({ id: crypto.randomUUID(), name, ownerId: userId, ... }).returning();

// Update
await db.update(project).set({ name: newName }).where(eq(project.id, projectId));

// Delete
await db.delete(project).where(eq(project.id, projectId));

// Count
const [{ value }] = await db.select({ value: count() }).from(project).where(eq(project.organizationId, orgId));
```

### Migration Workflow

1. Modify `src/lib/server/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:apply`
4. Verify with: `pnpm db:studio` (opens Drizzle Studio UI)

### Existing Auth Tables

These tables are managed by Better Auth. Do NOT modify their structure — add your own tables with foreign keys to `user.id` or `organization.id`.

| Table          | Key Columns                                                           |
| -------------- | --------------------------------------------------------------------- |
| `user`         | id, name, email, emailVerified, image, role, banned, twoFactorEnabled |
| `session`      | id, token, userId, activeOrganizationId, expiresAt                    |
| `account`      | id, accountId, providerId, userId, password                           |
| `verification` | id, identifier, value, expiresAt                                      |
| `organization` | id, name, slug, logo, metadata                                        |
| `member`       | id, organizationId, userId, role                                      |
| `invitation`   | id, organizationId, email, role, status, expiresAt, inviterId         |
| `two_factor`   | id, userId, secret, backupCodes                                       |

---

## Tailwind CSS v4

**Critical: Tailwind v4 has NO `tailwind.config.js` file.** All configuration is CSS-first in `src/app.css`.

### Theme System

Colors use **OKLch** format in CSS custom properties. Light theme in `:root`, dark theme in `.dark`:

```css
/* src/app.css */
:root {
	--primary: oklch(0.21 0.006 285.885);
	--primary-foreground: oklch(0.985 0.002 247.858);
	/* ... more colors */
}
.dark {
	--primary: oklch(0.92 0.004 286.32);
	--primary-foreground: oklch(0.21 0.006 285.885);
}
```

The `@theme inline` block maps CSS variables to Tailwind tokens:

```css
@theme inline {
	--color-primary: var(--primary);
	--color-primary-foreground: var(--primary-foreground);
}
```

### Dark Mode

Dark mode uses the `.dark` class on `<html>`. The system includes:

- **FOUC prevention** — inline script in `src/app.html` applies `.dark` before render based on `localStorage` or `prefers-color-scheme`
- **Toggle component** — `src/lib/components/layout/theme-toggle.svelte` toggles `.dark` class and persists to `localStorage`
- **Placement** — toggle is in the app header (`app-header.svelte`) and marketing header (`(marketing)/+layout.svelte`)

The toggle reads and writes `localStorage.getItem('theme')` with values `'light'` or `'dark'`.

### How to Change the Color Scheme

1. Edit the OKLch values in `src/app.css` `:root` (light) and `.dark` (dark) blocks
2. Use an OKLch color picker or [oklch.com](https://oklch.com) to generate values
3. The semantic tokens (primary, secondary, muted, accent, destructive) are used throughout all components

### Available Theme Tokens

Use these in Tailwind classes: `bg-primary`, `text-muted-foreground`, `border-border`, etc.

| Token                                    | Usage                              |
| ---------------------------------------- | ---------------------------------- |
| `background` / `foreground`              | Page background and text           |
| `card` / `card-foreground`               | Card backgrounds                   |
| `primary` / `primary-foreground`         | Primary buttons, links             |
| `secondary` / `secondary-foreground`     | Secondary buttons                  |
| `muted` / `muted-foreground`             | Muted text, backgrounds            |
| `accent` / `accent-foreground`           | Hover states, highlights           |
| `destructive` / `destructive-foreground` | Delete actions, errors             |
| `border`                                 | Border color                       |
| `input`                                  | Input border color                 |
| `ring`                                   | Focus ring color                   |
| `sidebar-*`                              | Sidebar-specific variants of above |

### DON'T — Tailwind v3 Patterns

```js
// WRONG: No tailwind.config.js in v4
module.exports = { theme: { extend: { colors: { ... } } } }

// WRONG: HSL color format (use OKLch)
--primary: 222.2 47.4% 11.2%;

// WRONG: @tailwind directives (use @import)
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### DO — Tailwind v4 Patterns

```css
/* Correct: CSS imports */
@import 'tailwindcss';

/* Correct: Custom variants */
@custom-variant dark (&:is(.dark *));

/* Correct: Custom utilities */
@utility no-scrollbar {
	scrollbar-width: none;
}

/* Correct: Theme inline block for custom tokens */
@theme inline {
	--color-brand: var(--brand);
}
```

---

## shadcn-svelte Components

### Import Pattern

```ts
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter
} from '$lib/components/ui/card';
```

### Adding New Components

```bash
pnpm dlx shadcn-svelte@latest add <component> -y --no-deps
```

Common components to add: `accordion`, `alert`, `alert-dialog`, `checkbox`, `collapsible`, `command`, `form`, `menubar`, `progress`, `radio-group`, `scroll-area`, `select`, `slider`, `switch`, `tabs`, `textarea`, `toggle`.

### Available Components in This Template

avatar, badge, button, card, dialog, dropdown-menu, input, label, separator, sheet, sidebar (full system), skeleton, table, tooltip

### Layout Components

- `src/lib/components/layout/app-sidebar.svelte` — Left nav (Dashboard, Profile, Organization, Members)
- `src/lib/components/layout/app-header.svelte` — Top bar with sidebar trigger + theme toggle + user menu
- `src/lib/components/layout/user-menu.svelte` — Avatar dropdown (profile, org, sign out)
- `src/lib/components/layout/theme-toggle.svelte` — Dark/light mode toggle (sun/moon)

### Icons

```ts
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
// Browse: https://lucide.dev/icons
```

---

## Organization Roles & Permissions

```
owner  → organization: update, delete | member: create, update, delete | invitation: create, cancel
admin  → organization: update         | member: create, update, delete | invitation: create, cancel
member → (read only — no actions)
```

Extend permissions in `src/lib/server/auth.ts`:

1. Add resource actions to the `statement` object
2. Assign permissions to `ownerRole`, `adminRole`, `memberRole`

### Organization-Scoped Data

All org-scoped queries should filter by `activeOrganizationId` from the session:

```ts
// In a server load function:
const orgId = locals.session?.activeOrganizationId;
if (!orgId) return { items: [] };
const items = await db.select().from(myTable).where(eq(myTable.organizationId, orgId));
```

---

## Adding a New Feature (Step by Step)

### Example: Adding a "Projects" Feature

1. **Schema**: Add `project` table to `src/lib/server/db/schema.ts` with `organizationId` FK
2. **Migrate**: Run `pnpm db:generate && pnpm db:apply`
3. **Server logic**: Create `src/lib/server/projects.ts` with CRUD functions (optional, can inline in load/actions)
4. **Route**: Create `src/routes/(app)/projects/+page.server.ts` (load + actions) and `+page.svelte`
5. **Navigation**: Add to `navItems` array in `src/lib/components/layout/app-sidebar.svelte`
6. **Types**: Types auto-generated by SvelteKit — use `PageProps` from `./$types`

### Adding a New Settings Page

1. Create `src/routes/(app)/settings/your-page/+page.svelte`
2. Optionally add `+page.server.ts` for data/actions
3. Add tab to `src/routes/(app)/settings/+layout.svelte` nav items
4. Organization data available via parent layout (`data.organization`, `data.members`)

---

## Environment Variables

| Variable                  | Required    | Description                                                  |
| ------------------------- | ----------- | ------------------------------------------------------------ |
| `DATABASE_URL`            | Yes         | PostgreSQL connection string                                 |
| `BETTER_AUTH_SECRET`      | Yes         | Auth encryption secret (generate: `openssl rand -base64 32`) |
| `BETTER_AUTH_URL`         | Yes         | App base URL (e.g., `http://localhost:5173`)                 |
| `EMAIL_PROVIDER`          | No          | `resend`, `sendgrid`, `smtp`, or `console` (default)         |
| `EMAIL_FROM`              | No          | Sender address (e.g., `MyApp <noreply@yourdomain.com>`)      |
| `RESEND_API_KEY`          | If resend   | Resend API key                                               |
| `SENDGRID_API_KEY`        | If sendgrid | SendGrid API key                                             |
| `SMTP_HOST`               | If smtp     | SMTP server host                                             |
| `SMTP_PORT`               | If smtp     | SMTP server port                                             |
| `SMTP_USER`               | If smtp     | SMTP username                                                |
| `SMTP_PASS`               | If smtp     | SMTP password                                                |
| `GOOGLE_CLIENT_ID`        | No          | Google OAuth client ID (buttons hidden if empty)             |
| `GOOGLE_CLIENT_SECRET`    | No          | Google OAuth client secret                                   |
| `GITHUB_CLIENT_ID`        | No          | GitHub OAuth client ID                                       |
| `GITHUB_CLIENT_SECRET`    | No          | GitHub OAuth client secret                                   |
| `MICROSOFT_CLIENT_ID`     | No          | Microsoft OAuth client ID                                    |
| `MICROSOFT_CLIENT_SECRET` | No          | Microsoft OAuth client secret                                |

OAuth callback URLs to register with providers: `{BETTER_AUTH_URL}/api/auth/callback/{provider}`

---

## Commands

```bash
pnpm dev              # Dev server (http://localhost:5173)
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm check            # TypeScript type checking
pnpm lint             # Lint + format check
pnpm format           # Auto-format code
pnpm db:generate      # Generate Drizzle migration from schema changes
pnpm db:apply         # Generate + apply migrations
pnpm db:push          # Push schema directly (no migration file)
pnpm db:studio        # Open Drizzle Studio (database UI)
docker compose up -d  # Start PostgreSQL container (port 5433)
```

---

## Deployment Checklist

1. Set `BETTER_AUTH_SECRET` — unique, 32+ char secret
2. Set `BETTER_AUTH_URL` — full production URL (e.g., `https://myapp.com`)
3. Set `DATABASE_URL` — production PostgreSQL connection string
4. Set `EMAIL_PROVIDER` + provider credentials — real email for production
5. Set `EMAIL_FROM` — verified sender address
6. Configure OAuth callback URLs at each provider: `{BETTER_AUTH_URL}/api/auth/callback/google` etc.
7. Run migrations: `pnpm db:apply`
8. Build: `pnpm build`
9. Run: `node build` (Node adapter)
10. Set `ORIGIN` env var to your production URL (required by SvelteKit Node adapter for CSRF)
11. Set `PORT` env var if not using default 3000

---

## First Steps When Starting a New Project

1. Update `src/lib/config.ts` — set `APP_NAME` and `APP_DESCRIPTION`
2. Copy `.env.example` to `.env` and configure
3. Start database: local PostgreSQL or `docker compose up -d`
4. Apply schema: `pnpm db:apply`
5. Start dev server: `pnpm dev`
6. Customize theme: edit OKLch colors in `src/app.css`
7. Add your domain tables to `src/lib/server/db/schema.ts`
8. Build your features inside `src/routes/(app)/`
