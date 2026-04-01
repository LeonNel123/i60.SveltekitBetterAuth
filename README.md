# i60 SvelteKit + Better Auth Template

A production-ready B2B SaaS starter built with SvelteKit 2, Svelte 5, Better Auth, PostgreSQL, Tailwind CSS v4, and shadcn-svelte.

## What's Included

- **Authentication** — Email/password, 2FA (TOTP + backup codes), session management
- **Multi-tenancy** — Organizations with roles (owner/admin/member), invitations, access control
- **Admin** — User management, banning, role assignment
- **Dashboard** — Sidebar navigation, header with user menu, settings pages
- **Email** — Pluggable provider (Resend, SendGrid, SMTP) with dev console fallback
- **Security** — Rate limiting, banned user enforcement, cookie-cached sessions, progressive enhancement
- **UI** — shadcn-svelte components, Tailwind CSS v4, dark mode ready

## Quick Start

```bash
# Clone and install
git clone <repo-url> my-app
cd my-app
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Start database and apply schema
docker compose up -d
pnpm db:apply

# Start dev server
pnpm dev
```

## Configuration

### App Name

Update `src/lib/config.ts` — all UI references (sidebar, landing page, emails, 2FA issuer) use this single constant:

```ts
export const APP_NAME = 'YourApp';
export const APP_DESCRIPTION = 'Your app description';
```

### Email Provider

Set `EMAIL_PROVIDER` in `.env` to: `resend`, `sendgrid`, `smtp`, or `console` (default).
See `.env.example` for provider-specific config.

### Database

PostgreSQL 17 via Docker Compose (port 5433). Change credentials in `.env` and `docker-compose.yml`.

## Tech Stack

| Layer     | Technology                             |
| --------- | -------------------------------------- |
| Framework | SvelteKit 2 + Svelte 5 (runes)         |
| Auth      | Better Auth (organization, admin, 2FA) |
| Database  | PostgreSQL 17 + Drizzle ORM            |
| Styling   | Tailwind CSS v4 + shadcn-svelte        |
| Runtime   | Node.js 20+                            |

## Project Structure

```
src/
  lib/
    config.ts              ← App name + description (change this first)
    server/
      auth.ts              ← Better Auth config (plugins, roles, email handlers)
      db/                  ← Drizzle client + schema
      email.ts             ← Pluggable email provider
    auth-client.ts         ← Better Auth client (organization, 2FA, admin)
    components/
      ui/                  ← shadcn-svelte components
      layout/              ← App sidebar, header, user menu
  routes/
    (marketing)/           ← Public pages (landing)
    (auth)/                ← Auth flows (login, register, forgot-password, 2FA, verify-email)
    (app)/                 ← Authenticated app (dashboard, settings)
    accept-invitation/     ← Org invitation accept/reject
    banned/                ← Suspended account page
```

## Commands

| Command            | Description                 |
| ------------------ | --------------------------- |
| `pnpm dev`         | Start dev server            |
| `pnpm build`       | Production build            |
| `pnpm check`       | TypeScript check            |
| `pnpm lint`        | Lint + format check         |
| `pnpm format`      | Auto-format                 |
| `pnpm db:generate` | Generate migrations         |
| `pnpm db:apply`    | Generate + apply migrations |

## For AI Agents

See `AGENTS.md` for structured context when building on this template.

---

<p align="center">
  <sub>Built with the <a href="https://i60.co">i60.co</a> SvelteKit + Better Auth template</sub>
</p>
