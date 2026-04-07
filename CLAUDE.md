# i60 SvelteKit + Better Auth Template

See `AGENTS.md` for full structured context (API references, auth flows, patterns). This file covers commands, conventions, and deployment.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm start` — run production build (`node build`)
- `pnpm check` — type check
- `pnpm lint` — lint and format check
- `pnpm format` — auto-format
- `pnpm db:generate` — generate migrations
- `pnpm db:apply` — generate + apply migrations
- `pnpm db:studio` — open Drizzle Studio

## Deployment

This template uses `@sveltejs/adapter-node`. Configure your deployment platform with these environment variables:

### Required Environment Variables

All env vars using `$env/static/private` MUST exist in production (even if empty) or the build will fail.

| Variable                     | Notes                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection string                                      |
| `BETTER_AUTH_SECRET`         | `openssl rand -base64 32`                                        |
| `BETTER_AUTH_URL`            | Full public URL (needed at build time)                            |
| `ORIGIN`                     | SvelteKit adapter-node CORS origin (same as public URL)           |
| `PORT`                       | Port for the Node server                                          |
| `NODE_ENV`                   | `production`                                                      |
| `EMAIL_PROVIDER`             | `resend`, `sendgrid`, or `smtp`                                   |
| `EMAIL_FROM`                 | e.g. `App Name <noreply@example.com>`                             |
| `SENDGRID_API_KEY`           | Set real value, or leave empty/`none`                             |
| `RESEND_API_KEY`             | Set real value, or leave empty/`none`                             |
| `SMTP_HOST/PORT/USER/PASS`   | Set real values, or leave empty                                   |
| `GOOGLE_CLIENT_ID/SECRET`    | Set real values to enable OAuth, or leave empty to hide buttons   |
| `GITHUB_CLIENT_ID/SECRET`    | Set real values to enable OAuth, or leave empty to hide buttons   |
| `MICROSOFT_CLIENT_ID/SECRET` | Set real values to enable OAuth, or leave empty to hide buttons   |

**Important:** `BETTER_AUTH_URL` and `ORIGIN` must be hardcoded URLs — Better Auth validates the URL at build time.

## Conventions

- Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect` — never use Svelte 4 syntax (`export let`, `$:`, `on:click`, `<slot>`)
- Form actions with `use:enhance` for mutations (progressive enhancement)
- Toast notifications via `svelte-sonner` for mutation feedback
- Client-side `authClient` calls for 2FA, org management, password change
- Server load functions for data fetching
- All app data scoped to `locals.session?.activeOrganizationId`
- Org members loaded in `(app)/+layout.server.ts` — available as `data.members` on all app pages
- `APP_NAME` in `src/lib/config.ts` — all UI/email references use this
- Shared format utilities in `src/lib/utils/format.ts` — `formatDate`, `formatCurrency`, `timeAgo`, `formatFileSize`, `currentGreeting`, `daysUntilDate`, `isOverdueDate`
- Organization helpers in `src/lib/server/organization.ts` — `normalizeOrganizationSlug()`, `getOrganizationAccessContext()`, `claimOrphanOrganizationForUser()`, `resolveOrgMemberUserId()`
- shadcn-svelte components in `src/lib/components/ui/`
- Server-only code in `src/lib/server/`
- Tailwind CSS v4 — CSS-first config in `src/app.css`, NO `tailwind.config.js`
- OKLch colour format for theme variables
- Dark mode toggle in header — persists to localStorage, detects system preference

## App Routes

- `/dashboard` — Welcome page with quick links to settings

### API Routes

- `/api/auth/*` — Better Auth handler (mounted in `hooks.server.ts`)

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
