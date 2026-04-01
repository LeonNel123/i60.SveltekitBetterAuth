# Bokeros

B2B SaaS skeleton built with SvelteKit 2, Svelte 5, PostgreSQL 17, Better Auth, Tailwind CSS v4, shadcn-svelte, and Drizzle ORM.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm check` — type check
- `pnpm lint` — lint and format check
- `pnpm format` — auto-format
- `pnpm test` — run tests
- `pnpm db:generate` — generate migrations
- `pnpm db:apply` — generate + apply migrations (recommended on Windows)
- `pnpm db:push` — push schema directly (may hang on Windows — use db:apply instead)
- `docker compose up -d` — start PostgreSQL (port 5433, avoids conflict with local Postgres)

## Architecture

- Single SvelteKit monolith with Node adapter
- Better Auth for authentication (organization, admin, 2FA plugins)
- Drizzle ORM with postgres-js driver for database access
- Pluggable email provider (Resend, SendGrid, or SMTP) via `EMAIL_PROVIDER` env var
- Route groups: `(marketing)` public, `(auth)` login/register, `(app)` authenticated
- Auth guard in `(app)/+layout.server.ts`
- Session populated in `hooks.server.ts` and available via `event.locals`

## Email Provider

Set `EMAIL_PROVIDER` in `.env` to one of: `resend`, `sendgrid`, `smtp`, or `console` (default).
Configure only the section for your chosen provider — see `.env.example` for all options.
Email abstraction is in `src/lib/server/email.ts`.

## Conventions

- Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)
- Server load functions for data fetching (`+page.server.ts`)
- Form actions for mutations (progressive enhancement)
- shadcn-svelte components in `src/lib/components/ui/`
- Custom layout components in `src/lib/components/layout/`
- Server-only code in `src/lib/server/`
