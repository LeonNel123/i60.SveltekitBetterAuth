# i60 SvelteKit + Better Auth Template

See `AGENTS.md` for full structured context (API references, auth flows, patterns). This file covers commands and key conventions.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm check` — type check
- `pnpm lint` — lint and format check
- `pnpm format` — auto-format
- `pnpm db:generate` — generate migrations
- `pnpm db:apply` — generate + apply migrations
- `pnpm db:studio` — open Drizzle Studio
- `docker compose up -d` — start PostgreSQL via Docker (port 5433)

## Conventions

- Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect` — never use Svelte 4 syntax (`export let`, `$:`, `on:click`, `<slot>`)
- Form actions with `use:enhance` for mutations (progressive enhancement)
- Client-side `authClient` calls for 2FA, org management, password change
- Server load functions for data fetching
- `APP_NAME` in `src/lib/config.ts` — all UI/email references use this
- `EMAIL_PROVIDER` env var — resend, sendgrid, smtp, or console
- shadcn-svelte components in `src/lib/components/ui/`
- Server-only code in `src/lib/server/`
- Tailwind CSS v4 — CSS-first config in `src/app.css`, NO `tailwind.config.js`
- OKLch color format for theme variables
- Dark mode toggle in header — persists to localStorage, detects system preference
- QR code for TOTP setup via `qrcode` package

## Auth Routes

- `/login`, `/register` — form actions (server-side auth)
- `/forgot-password` — sends reset email
- `/reset-password` — receives token from email, sets new password
- `/verify-email` — OTP verification (client-side)
- `/two-factor` — TOTP/backup code (client-side)
- `/settings/security` — inline password change + 2FA management (client-side)

## Key Auth APIs

- Server: `auth.api.signInEmail()`, `auth.api.signUpEmail()`, `auth.api.resetPassword()`, `auth.api.getSession()`
- Client: `authClient.signIn.social()`, `authClient.changePassword()`, `authClient.twoFactor.*`, `authClient.organization.*`, `authClient.emailOtp.*`
