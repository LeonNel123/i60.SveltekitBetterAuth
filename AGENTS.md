# Agent Context — i60 SvelteKit + Better Auth Template

> This file provides structured context for AI agents building on this template.
> It is read automatically by Claude Code, Cursor, Windsurf, and other AI coding tools.

## First Steps When Starting a New Project

1. Update `src/lib/config.ts` — set `APP_NAME` and `APP_DESCRIPTION`
2. Copy `.env.example` to `.env` and configure
3. Run `docker compose up -d && pnpm db:apply` to set up the database

## Architecture

Single SvelteKit 2 monolith (Node adapter). No separate API server.

- **Auth**: Better Auth with plugins: organization (multi-tenant), admin, twoFactor
- **Database**: PostgreSQL 17, Drizzle ORM (postgres-js driver), schema at `src/lib/server/db/schema.ts`
- **Email**: Pluggable provider via `src/lib/server/email.ts` — set `EMAIL_PROVIDER` env var
- **UI**: Tailwind CSS v4, shadcn-svelte components in `src/lib/components/ui/`

## Route Groups

| Group                    | Purpose                                                          | Auth Required                             |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------- |
| `(marketing)`            | Public pages — landing                                           | No                                        |
| `(auth)`                 | Auth flows — login, register, forgot-password, 2FA, verify-email | No (redirects to /dashboard if logged in) |
| `(app)`                  | Authenticated app — dashboard, settings                          | Yes (redirects to /login if not)          |
| `accept-invitation/[id]` | Org invitation accept/reject                                     | Yes (standalone, outside groups)          |
| `banned`                 | Suspended account page                                           | No guard                                  |

## Key Files

| File                          | Purpose                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/lib/config.ts`           | `APP_NAME`, `APP_DESCRIPTION` — used in UI, emails, 2FA issuer                                            |
| `src/lib/server/auth.ts`      | Better Auth server config — plugins, roles, access control, rate limits, email handlers                   |
| `src/lib/auth-client.ts`      | Better Auth client — organizationClient, twoFactorClient, adminClient                                     |
| `src/lib/server/email.ts`     | Email abstraction — `sendEmail()` routes to configured provider                                           |
| `src/lib/server/db/schema.ts` | Drizzle schema — user, session, account, verification, organization, member, invitation, twoFactor tables |
| `src/lib/server/db/index.ts`  | Drizzle client instance                                                                                   |
| `src/hooks.server.ts`         | Session population, banned user enforcement, Better Auth handler                                          |
| `src/app.d.ts`                | TypeScript types for `App.Locals` (session, user)                                                         |

## Patterns to Follow

### Data Flow

- Server load functions (`+page.server.ts`, `+layout.server.ts`) for data fetching
- Form actions (`+page.server.ts` actions) for mutations — provides progressive enhancement
- `event.locals.session` and `event.locals.user` available in all server load functions (set in hooks)

### Svelte 5 Runes

- `$state()` for mutable reactive state
- `$derived()` for computed values (never use `$effect` for derived state)
- `$props()` for component props — use typed `PageProps`/`LayoutProps` from `$types`
- `{@render children()}` not `<slot>`
- `onclick` not `on:click`

### Auth Patterns

- Form actions with `use:enhance` for login/register/forgot-password (progressive enhancement)
- Client-side `authClient` for 2FA verification, org management, settings (requires JS)
- Auth guard in `(app)/+layout.server.ts` — redirects to `/login`
- Session data from root layout available to all pages via `data.user` / `data.session`

### Components

- shadcn-svelte components: `import { Button } from '$lib/components/ui/button'`
- Add new components: `pnpm dlx shadcn-svelte@latest add <component> -y --no-deps`
- Custom layout components in `src/lib/components/layout/`

### Adding New Features

- Add domain tables to `src/lib/server/db/schema.ts`
- Generate migration: `pnpm db:generate`
- Apply migration: `pnpm db:apply`
- All org-scoped data should use `activeOrganizationId` from session
- Server-only code goes in `src/lib/server/`

## Organization Roles & Permissions

```
owner  → organization: update, delete | member: create, update, delete | invitation: create, cancel
admin  → organization: update         | member: create, update, delete | invitation: create, cancel
member → (read only)
```

Extend permissions in `src/lib/server/auth.ts` — add resource actions to the `statement` object, then assign to roles.

## Commands

```bash
pnpm dev              # Dev server
pnpm build            # Production build
pnpm check            # TypeScript check
pnpm lint             # Lint + format check
pnpm format           # Auto-format
pnpm db:generate      # Generate Drizzle migration
pnpm db:apply         # Generate + apply migration
docker compose up -d  # Start PostgreSQL (port 5433)
```
