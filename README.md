# i60 SvelteKit + Better Auth Template

A production-ready B2B SaaS starter built with SvelteKit 2, Svelte 5, Better Auth, PostgreSQL, Drizzle ORM, Tailwind CSS v4, and shadcn-svelte.

## Features

- **Email/Password Auth** — Sign up, sign in, password reset with email link, inline password change
- **Email Verification** — OTP-based (6-digit code, 5-min expiry)
- **Two-Factor Auth** — TOTP with authenticator app + backup codes
- **OAuth** — Google, GitHub, Microsoft (conditionally shown based on env vars)
- **Multi-Tenancy** — Organizations with roles (owner/admin/member), invitations, access control
- **Admin** — User management, banning, role assignment
- **Settings** — Profile, organization, members, security (2FA + password change)
- **Email Providers** — Pluggable: Resend, SendGrid, SMTP, or console (dev)
- **Security** — Rate limiting, banned user enforcement, cookie-cached sessions, progressive enhancement
- **UI** — shadcn-svelte components, sidebar layout, dark/light mode toggle with system detection
- **Dashboard** — Sidebar navigation, header with user menu, live org stats

## Quick Start

```bash
# Clone and install
git clone <repo-url> my-app
cd my-app
pnpm install

# Set up environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and BETTER_AUTH_SECRET

# Option A: Local PostgreSQL
pnpm db:apply

# Option B: Docker (starts PostgreSQL on port 5433)
docker compose up -d
pnpm db:apply

# Start dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and create an account.

## Auth Flows

| Flow               | Route                     | Method                         |
| ------------------ | ------------------------- | ------------------------------ |
| Sign up            | `/register`               | Form action (server-side)      |
| Email verification | `/verify-email`           | Client-side OTP                |
| Sign in            | `/login`                  | Form action (server-side)      |
| Two-factor         | `/two-factor`             | Client-side TOTP/backup code   |
| Forgot password    | `/forgot-password`        | Form action (sends email)      |
| Reset password     | `/reset-password`         | Form action (token from email) |
| OAuth              | `/login` or `/register`   | Client-side redirect           |
| Accept invitation  | `/accept-invitation/[id]` | Form action                    |
| Change password    | `/settings/security`      | Client-side                    |
| Enable/disable 2FA | `/settings/security`      | Client-side                    |

**Sign-up flow**: Register -> verify email via OTP -> dashboard
**Sign-in flow**: Login -> (optional 2FA) -> dashboard
**Password reset**: Forgot password -> email link -> set new password -> login

## Configuration

### App Identity

Update `src/lib/config.ts` — all UI, emails, and 2FA issuer use these constants:

```ts
export const APP_NAME = 'YourApp';
export const APP_DESCRIPTION = 'Your app description';
```

### Database

PostgreSQL 17 with Drizzle ORM. Two options:

- **Local PostgreSQL** — set `DATABASE_URL` in `.env` (default port 5432)
- **Docker Compose** — run `docker compose up -d` (port 5433)

Manage schema with Drizzle migrations:

```bash
pnpm db:generate   # Generate migration from schema changes
pnpm db:apply      # Generate + apply migrations
pnpm db:studio     # Open Drizzle Studio (database browser)
```

### Email Provider

Set `EMAIL_PROVIDER` in `.env`:

| Provider   | Env Vars Needed                                    |
| ---------- | -------------------------------------------------- |
| `console`  | None (prints to terminal — default for dev)        |
| `resend`   | `RESEND_API_KEY`                                   |
| `sendgrid` | `SENDGRID_API_KEY`                                 |
| `smtp`     | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |

### OAuth Providers

Leave env vars empty to hide OAuth buttons. Set both ID and secret to enable:

| Provider  | Env Vars                                         | Callback URL                                    |
| --------- | ------------------------------------------------ | ----------------------------------------------- |
| Google    | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`       | `{BETTER_AUTH_URL}/api/auth/callback/google`    |
| GitHub    | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`       | `{BETTER_AUTH_URL}/api/auth/callback/github`    |
| Microsoft | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | `{BETTER_AUTH_URL}/api/auth/callback/microsoft` |

### Theme

Colors are defined as OKLch CSS custom properties in `src/app.css`. Edit `:root` (light) and `.dark` (dark) blocks to change the color scheme. No `tailwind.config.js` — Tailwind v4 uses CSS-first configuration.

## Project Structure

```
src/
  lib/
    config.ts              <- App name + description (change first)
    auth-client.ts         <- Better Auth client (plugins mirror server)
    server/
      auth.ts              <- Better Auth server config (plugins, roles, rate limits)
      email.ts             <- Pluggable email provider
      db/
        schema.ts          <- Drizzle schema (auth + domain tables go here)
        index.ts           <- Drizzle client
    components/
      ui/                  <- shadcn-svelte components
      layout/              <- App sidebar, header, user menu
  routes/
    (marketing)/           <- Public pages (landing)
    (auth)/                <- Auth flows (login, register, forgot/reset password, verify-email, 2FA)
    (app)/                 <- Authenticated pages (dashboard, settings)
    accept-invitation/     <- Org invitation accept/reject
    banned/                <- Suspended account page
  hooks.server.ts          <- Session population, ban enforcement
  app.css                  <- Tailwind + theme (OKLch color variables)
  app.d.ts                 <- TypeScript types for App.Locals
```

## Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Framework | SvelteKit 2 + Svelte 5 (runes)                    |
| Auth      | Better Auth (organization, admin, 2FA, email OTP) |
| Database  | PostgreSQL 17 + Drizzle ORM                       |
| Styling   | Tailwind CSS v4 + shadcn-svelte                   |
| Runtime   | Node.js 20+                                       |

## Commands

| Command            | Description                |
| ------------------ | -------------------------- |
| `pnpm dev`         | Start dev server           |
| `pnpm build`       | Production build           |
| `pnpm preview`     | Preview production build   |
| `pnpm check`       | TypeScript check           |
| `pnpm lint`        | Lint + format check        |
| `pnpm format`      | Auto-format code           |
| `pnpm db:generate` | Generate Drizzle migration |
| `pnpm db:apply`    | Generate + apply migration |
| `pnpm db:studio`   | Open Drizzle Studio        |

## Deployment

1. Set production env vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`, `EMAIL_PROVIDER` + credentials
2. Configure OAuth callback URLs at each provider
3. Run `pnpm db:apply` against production database
4. Build: `pnpm build`
5. Run: `node build`
6. Set `ORIGIN` env var to your production URL (required by SvelteKit Node adapter)

## For AI Agents

See `AGENTS.md` for comprehensive structured context — API references, auth flows, patterns, anti-hallucination guide.

---

<p align="center">
  <sub>Built with the <a href="https://i60.co">i60.co</a> SvelteKit + Better Auth template</sub>
</p>
