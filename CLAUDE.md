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
