# i60 SvelteKit + Better Auth Template

See `AGENTS.md` for full structured context. This file covers commands and key conventions.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm check` — type check
- `pnpm lint` — lint and format check
- `pnpm format` — auto-format
- `pnpm db:generate` — generate migrations
- `pnpm db:apply` — generate + apply migrations
- `docker compose up -d` — start PostgreSQL (port 5433)

## Conventions

- Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect`
- Form actions with `use:enhance` for mutations (progressive enhancement)
- Server load functions for data fetching
- `APP_NAME` in `src/lib/config.ts` — all UI/email references use this
- `EMAIL_PROVIDER` env var — resend, sendgrid, smtp, or console
- shadcn-svelte components in `src/lib/components/ui/`
- Server-only code in `src/lib/server/`
