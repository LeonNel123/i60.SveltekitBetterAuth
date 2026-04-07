# BrokerOS — CRM Command Centre

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

## Deployment — Railway

**Production URL:** https://brokeros-production-8656.up.railway.app
**Railway Dashboard:** https://railway.com/project/869c0a26-e441-4bb8-ba48-c551d4a6b650

### Services

- **BrokerOS** — SvelteKit app (adapter-node), starts with `pnpm start` → `node build`
- **Postgres** — Railway-managed PostgreSQL, connected via `${{Postgres.DATABASE_URL}}` reference

### Deploy Commands

```bash
railway service BrokerOS       # link to app service
railway up --detach            # deploy current code
railway logs                   # check build/runtime logs
railway variables              # view env vars
```

### Push Schema to Production DB

```bash
# Get the public Postgres URL from Railway:
railway service Postgres
railway variables --json | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.DATABASE_PUBLIC_URL);"

# Push schema directly:
DATABASE_URL="<public-url>" npx drizzle-kit push --force
```

### Environment Variables (Railway)

All env vars using `$env/static/private` MUST exist on Railway (even if empty) or the build will fail.

| Variable                     | Value                                             | Notes                                                                       |
| ---------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`               | `${{Postgres.DATABASE_URL}}`                      | Railway reference to internal Postgres                                      |
| `BETTER_AUTH_SECRET`         | Generated secret                                  | `openssl rand -base64 32`                                                   |
| `BETTER_AUTH_URL`            | `https://brokeros-production-8656.up.railway.app` | Must be the full public URL, not a Railway reference (needed at build time) |
| `ORIGIN`                     | `https://brokeros-production-8656.up.railway.app` | SvelteKit adapter-node CORS origin                                          |
| `PORT`                       | `3000`                                            | Railway expects this                                                        |
| `NODE_ENV`                   | `production`                                      |                                                                             |
| `EMAIL_PROVIDER`             | `sendgrid`                                        |                                                                             |
| `EMAIL_FROM`                 | `BrokerOS <admin@isixty.co.za>`                   |                                                                             |
| `SENDGRID_API_KEY`           | Actual key                                        |                                                                             |
| `RESEND_API_KEY`             | `none`                                            | Placeholder — required by static import                                     |
| `SMTP_HOST/PORT/USER/PASS`   | `none`/`0`/`none`/`none`                          | Placeholders — required by static import                                    |
| `GOOGLE_CLIENT_ID/SECRET`    | `none`/`none`                                     | Placeholders — set real values to enable OAuth                              |
| `GITHUB_CLIENT_ID/SECRET`    | `none`/`none`                                     | Placeholders                                                                |
| `MICROSOFT_CLIENT_ID/SECRET` | `none`/`none`                                     | Placeholders                                                                |

**Important:** `BETTER_AUTH_URL` and `ORIGIN` must be hardcoded URLs, not `${{RAILWAY_PUBLIC_DOMAIN}}` references — Better Auth validates the URL at build time.

## Conventions

- Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect` — never use Svelte 4 syntax (`export let`, `$:`, `on:click`, `<slot>`)
- Form actions with `use:enhance` for mutations (progressive enhancement)
- Toast notifications via `svelte-sonner` for mutation feedback
- Client-side `authClient` calls for 2FA, org management, password change
- Server load functions for data fetching
- All CRM data scoped to `locals.session?.activeOrganizationId`
- Org members loaded in `(app)/+layout.server.ts` — available as `data.members` on all app pages
- `APP_NAME` in `src/lib/config.ts` — all UI/email references use this
- Shared format utilities in `src/lib/utils/format.ts` — `formatDate`, `formatCurrency`, `timeAgo`, `formatFileSize`, `currentGreeting`, `daysUntilDate`, `isOverdueDate`, `policyTypeLabel`, `policyStatusLabel/Variant`, `claimStatusLabel/Variant`
- CRM type constants in `src/lib/types.ts` — status enums, task types, tag definitions
- Task board definitions in `src/lib/tasks.ts` — 6 operational boards with filtering helpers
- Task board server filtering in `src/lib/server/task-boards.ts` — `taskBoardWhere()` builds board-specific queries
- Organization helpers in `src/lib/server/organization.ts` — `normalizeOrganizationSlug()`, `getOrganizationAccessContext()`, `claimOrphanOrganizationForUser()`, `resolveOrgMemberUserId()`, `filterVisibleTagIds()`
- System tag seeding in `src/lib/server/seed-tags.ts` — auto-seeds 10 system tags on startup
- Activity logging via `src/lib/server/activity.ts` — call `logActivity()` for all mutations
- File uploads stored in `data/uploads/[orgId]/` via `src/lib/server/files.ts`
- shadcn-svelte components in `src/lib/components/ui/`
- Server-only code in `src/lib/server/`
- Tailwind CSS v4 — CSS-first config in `src/app.css`, NO `tailwind.config.js`
- OKLch colour format for theme variables
- Dark mode toggle in header — persists to localStorage, detects system preference

## CRM Routes

- `/dashboard` — Command Centre (KPI stats, task board switcher, workload chart, overdue alerts, 30-day renewals, activity feed)
- `/clients` — Client list with search and pagination
- `/clients/new` — Create client
- `/clients/[id]` — Client detail (tabs: policies, claims, tasks, documents, notes, activity)
- `/clients/[id]/edit` — Edit client (includes delete)
- `/tasks` — Task list with board filtering (`?board=`), task type/priority filters, and search
- `/tasks/[id]` — Task detail with status updates, assignment, edit, delete
- `/documents` — Document browser with search and tag filtering

### Task Boards

6 operational boards filter tasks by role, type, and assignment:

| Board | Key | Filter Logic |
|-------|-----|-------------|
| My Queue | `my-queue` | Assigned to current user |
| Team Ops | `team-ops` | All open tasks org-wide |
| Renewals | `renewals` | Task type = renewal OR linked to policy |
| Claims | `claims` | Task type = claim OR linked to claim |
| Outstanding Docs | `outstanding-docs` | Task type = document or compliance |
| Triage | `triage` | Unassigned tasks needing allocation |

### API Routes

- `/api/auth/*` — Better Auth handler (mounted in `hooks.server.ts`)
- `/api/documents/[id]` — GET: download document file (streams from `data/uploads/`)

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
