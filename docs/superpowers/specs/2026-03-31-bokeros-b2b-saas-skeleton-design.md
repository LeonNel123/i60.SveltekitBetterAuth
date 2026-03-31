# Bokeros — B2B SaaS Skeleton Design

## Overview

Bokeros is a generic B2B SaaS skeleton built with SvelteKit 2, Svelte 5, PostgreSQL 17, Better Auth, Tailwind CSS v4, shadcn-svelte, and Drizzle ORM. It provides a production-ready foundation: authentication, organization/team management, a dashboard shell, settings pages, and a public landing page.

## Architecture

**Monolith with SvelteKit Server.** A single SvelteKit application (Node adapter) handles both rendering and server-side logic. No separate API server.

```
Browser → SvelteKit (Node adapter) → PostgreSQL 17
                ↕
          Better Auth (middleware)
          Drizzle ORM (queries)
```

### Multi-tenancy

Organization-based. Every user belongs to one or more organizations. All tenant-scoped data uses an `org_id` foreign key. Org context is enforced in application code (not DB-level RLS). The active org is resolved in the app layout's server load function and passed to all child routes via `$page.data`.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | SvelteKit | 2.x (latest) |
| UI Framework | Svelte | 5.x (latest, runes) |
| Database | PostgreSQL | 17 |
| ORM | Drizzle ORM | latest |
| Auth | Better Auth | latest |
| Styling | Tailwind CSS | v4 |
| Components | shadcn-svelte | latest (Svelte 5 compatible) |
| Runtime | Node.js | 20+ |
| Package Manager | pnpm | latest |

## Route Structure

```
src/routes/
  (marketing)/                → Public pages
    +page.svelte              → Landing page with sign-up CTA
    +layout.svelte            → Marketing layout (nav header + footer)

  (auth)/                     → Auth flows (public, redirect if logged in)
    login/+page.svelte
    register/+page.svelte
    forgot-password/+page.svelte

  (app)/                      → Authenticated app shell
    +layout.server.ts         → Auth guard: redirect to /login if no session; load user + active org
    +layout.svelte            → App shell: sidebar nav + header + content area
    dashboard/+page.svelte    → Dashboard home (placeholder content)
    settings/
      profile/+page.svelte    → User profile settings
      organization/+page.svelte → Org name, slug, billing-ready placeholder
      members/+page.svelte    → Team member list, invite, role management

  api/auth/[...all]/          → Better Auth catch-all API handler
    +server.ts
```

### Route group rationale

- `(marketing)` — public layout with marketing nav/footer, no auth required
- `(auth)` — minimal layout for auth forms, redirects to app if already logged in
- `(app)` — authenticated layout with sidebar, guards all child routes

## Database Schema

### Better Auth managed tables

Better Auth with the organization plugin manages these tables automatically:
- `user` — id, name, email, emailVerified, image, createdAt, updatedAt
- `session` — id, userId, token, expiresAt, ipAddress, userAgent
- `account` — id, userId, providerId, accountId, accessToken, refreshToken, etc.
- `verification` — id, identifier, value, expiresAt
- `organization` — id, name, slug, logo, metadata, createdAt
- `member` — id, userId, organizationId, role, createdAt
- `invitation` — id, email, organizationId, role, inviterId, status, expiresAt

### Custom tables

None initially. The skeleton provides the auth/org foundation. Domain-specific tables are added as features are built.

## Auth Configuration

### Better Auth setup

- **Core:** Email/password authentication
- **Organization plugin:** Multi-tenant org management with roles (owner, admin, member)
- **Session management:** Cookie-based sessions with server-side validation
- **Social OAuth:** Configured but disabled by default. Env vars enable Google, GitHub providers.

### Auth flow

1. User registers → account created → session started → redirect to org creation or dashboard
2. User logs in → session validated → active org resolved → app shell loads
3. Auth guard in `(app)/+layout.server.ts` checks session on every request; redirects to `/login` if missing

### Roles

- **owner** — full org control, can delete org, manage billing
- **admin** — manage members, invite users, manage settings
- **member** — read/write access to org resources

## Key Implementation Patterns

### Server load functions

All data fetching happens in `+page.server.ts` / `+layout.server.ts`. Load functions receive the auth session and active org from the layout, query Drizzle, and return typed data.

### Form actions

Mutations use SvelteKit form actions (`+page.server.ts` actions). This provides progressive enhancement — forms work without JS.

### Org context

The `(app)/+layout.server.ts` load function resolves the user's active organization and passes it as layout data. All child routes access it via `$page.data.organization`. If the user has no org, they're redirected to an org creation flow.

### Component usage

shadcn-svelte components are added via CLI (`npx shadcn-svelte@latest add <component>`). Initial components needed: button, card, input, label, dropdown-menu, avatar, separator, sidebar, dialog, badge, table.

## Project Configuration

### TypeScript

Strict mode enabled. All server and client code is TypeScript.

### Tooling

- **ESLint** — svelte and typescript configs
- **Prettier** — with prettier-plugin-svelte and prettier-plugin-tailwindcss
- **Vitest** — unit testing framework

### Environment variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bokeros
BETTER_AUTH_SECRET=<random-secret>
BETTER_AUTH_URL=http://localhost:5173
# Optional OAuth (uncomment to enable)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
```

### Local development

Docker Compose provides PostgreSQL for local development:

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: bokeros
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### File structure (non-route)

```
src/
  lib/
    server/
      db/
        index.ts          → Drizzle client instance
        schema.ts         → Drizzle schema (re-exports Better Auth tables + custom)
      auth.ts             → Better Auth server instance + config
    auth-client.ts        → Better Auth client instance
    components/
      ui/                 → shadcn-svelte components (added via CLI)
      layout/
        sidebar.svelte    → App sidebar navigation
        header.svelte     → App header with user menu
  app.css                 → Tailwind CSS entry point
```

## Out of Scope

- Billing/payments (Stripe integration) — skeleton is "billing-ready" with a placeholder settings page
- Email sending (transactional emails) — Better Auth handles verification tokens; actual sending deferred
- File uploads
- Real-time features (WebSockets)
- CI/CD pipeline
- Production deployment config
- Domain-specific business logic
