# BrokerOS Design & UX Refinement — Spec

**Date:** 2026-04-06
**Approach:** Foundation-Up — global design system first, then page-by-page sweep
**Direction:** Clean & Spacious — generous whitespace, large radius, soft borders, modern and breathable
**Audience:** Mixed — power users (brokers) + occasional users (managers, admin staff)

---

## 1. Foundation Layer

### 1A. Spacing Scale

Standardise all spacing to this scale. Eliminate ad-hoc values.

| Token | Size | Usage |
|-------|------|-------|
| `gap-1` | 4px | Inline elements, icon-to-label gaps |
| `gap-2` | 8px | Form label to input, tight groups |
| `gap-3` | 12px | List items, table row internal spacing |
| `gap-4` | 16px | Card internal padding, form field spacing |
| `gap-6` | 24px | Section spacing, card-to-card gaps |
| `gap-8` | 32px | Page sections, major layout breaks |

**Rules:**
- Page header to first content: `gap-8`
- Between content sections (e.g., KPI cards → task list): `gap-6`
- Within a card: `gap-4`
- Form label to input: `gap-2`
- Main content area padding remains `p-6`

### 1B. Typography Hierarchy

| Role | Classes | Usage |
|------|---------|-------|
| Page title | `text-2xl font-semibold tracking-tight` | One per page — "Command Centre", "Clients", etc. |
| Page subtitle | `text-sm text-muted-foreground` | Below page title — greeting, description |
| Section heading | `text-lg font-semibold` | Card section titles — "My Tasks", "Policies", "Details" |
| Card title | `text-base font-medium` | Within cards when section heading is already present |
| Body text | `text-sm` | Default content text |
| Label / meta | `text-xs text-muted-foreground` | Metadata, stat labels. Use `uppercase tracking-wide` for KPI labels. |
| KPI number | `text-3xl font-bold` | Dashboard stat values |

**Changes from current:**
- Page titles: `text-3xl font-bold` → `text-2xl font-semibold` (less heavy)
- Section headings: `text-base` → `text-lg font-semibold` (more visible)
- KPI labels: add `uppercase tracking-wide` for differentiation

### 1C. Colour Refinements

**Muted text contrast:** Bump `--muted-foreground` slightly darker for WCAG AA compliance in both light and dark mode. Target 4.5:1 ratio minimum.

**Semantic colour system — use consistently everywhere:**

| Meaning | Background | Text | Usage |
|---------|-----------|------|-------|
| Destructive / Urgent / Overdue | `bg-red-500/10` | `text-red-600 dark:text-red-400` | Urgent tasks, overdue items, delete actions, claims rejected |
| Warning / High / Expiring soon | `bg-orange-500/10` | `text-orange-600 dark:text-orange-400` | High priority, renewals ≤14 days, warnings |
| Success / Active / Settled | `bg-green-500/10` | `text-green-600 dark:text-green-400` | Active policies, settled claims, completed tasks |
| Info / Medium / Primary | `bg-blue-500/10` | `text-blue-600 dark:text-blue-400` | Medium priority, info badges, primary actions |
| Neutral / Low | `bg-slate-500/10` | `text-slate-600 dark:text-slate-400` | Low priority, default/inactive states |

**Fix:** Replace all yellow text on light backgrounds (`text-yellow-600`) with orange (`text-orange-600`). Yellow fails WCAG on white.

**Card & surface treatment:**
- Cards: `rounded-xl` (12px radius), 1px border, no shadow. Hover: `hover:bg-accent/50` transition.
- Grouped list rows: `rounded-lg` (8px), muted bg on hover, 1px dividers.
- Dialogs: `rounded-xl`.

---

## 2. Shared Components & UX Patterns

### 2A. Empty States

**Rule:** Every empty state uses the `EmptyState` component. No plain `<p>` tag fallbacks.

Each empty state includes:
- Icon (from lucide, contextual to the section)
- Title (e.g., "No notes yet")
- Description (explains what this section is for, not just "nothing here")
- Primary action button when applicable

**Apply to:** notes-tab, policies-tab, claims-tab, documents-tab, tasks-tab, dashboard task sections, dashboard activity, dashboard renewals, members page, documents page (filter no-match).

### 2B. Loading & Submission States

**Button loading pattern:**
- All form submit buttons: disable on submit, show spinner + "Saving..." / "Creating..." text
- Apply to: client form, task create/edit, policy/claim/document/note dialogs, settings forms, auth forms, invite form

**Search loading:**
- Show a small spinner inside the search input during debounce + fetch
- Apply to: client list search, task list search, document search

**Dialog submission safety:**
- Prevent dialog close (escape key + cancel button + overlay click) while a form submission is in flight
- Only close dialog on confirmed success from server response
- Apply to: all dialog-based forms (policies, claims, tasks, documents, notes)

**Not in scope:** Skeleton loaders. SvelteKit SSR means data is present on initial page load. No client-side data fetching occurs.

### 2C. Table & List Improvements

**Row semantics:**
- Replace `role="button" tabindex={0} onkeydown` on `<TableRow>` with a clickable `<a>` tag inside the first cell (name column) that navigates to the detail page. Remove `onclick`/`onkeydown`/`role`/`tabindex` from the row itself. Keep `cursor-pointer hover:bg-muted/50` on the row for visual feedback only.
- This fixes: keyboard navigation (Tab/Enter), screen reader announcements, right-click/open-in-new-tab
- Apply to: client list rows, task list rows

**Row spacing:**
- Table cell padding: increase to `py-3.5 px-4` (from default ~8px)
- Table header: `text-xs font-medium text-muted-foreground` with `py-3 px-4`

**Row hover:**
- Consistent `hover:bg-muted/50 transition-colors` on all clickable rows

### 2D. Form Improvements

**Required fields:**
- Add red asterisk `*` after required field labels
- Add `(optional)` suffix on non-required fields (use whichever is less common per form)

**Error banners:**
- Improve visibility: add `AlertCircle` icon prefix to error messages
- Keep server-side validation — no client-side JS validation added

**Apply to:** client-form, task create/edit dialogs, policy/claim/document/note dialogs, profile settings, org create, member invite, all auth forms.

### 2E. Accessibility

**Semantic table rows:** Replace `role="button"` with `<a>` tags (covered in 2C).

**Icon aria-labels:**
- Add `aria-hidden="true"` to decorative icons (empty state icons, KPI card icons)
- Ensure all status/priority badges include visible text labels, not just colour

**Skip-to-main link:**
- Add visually hidden skip link in `app.html` or root layout: `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to main content</a>`
- Add `id="main-content"` to the `<main>` element

**Contrast:**
- Bump `--muted-foreground` darker (covered in 1C)
- Replace yellow text with orange (covered in 1C)
- Ensure all renewal urgency text includes descriptive prefix, not just colour

---

## 3. Page-by-Page Sweep

### 3A. Dashboard — Command Centre

- Page title: `text-2xl font-semibold tracking-tight` (from `text-3xl font-bold`)
- Header to KPI cards: `gap-8`
- KPI stat cards: `rounded-xl`, stat labels `text-xs uppercase tracking-wide`, stat numbers `text-3xl font-bold`, subtle hover transition
- Section headings (My Tasks, Overdue, Renewing Soon, Activity): `text-lg font-semibold` (from `text-base`)
- Between sections: `gap-6`
- Task items: padding `p-4`, entire row as link with `rounded-lg hover:bg-muted/50`
- Priority badges: always show text label alongside colour
- Renewal urgency: replace yellow with orange, add "Expires in X days" text prefix, wrap in link to client
- Empty states: replace plain text with `EmptyState` component — "You're all caught up" for empty overdue, contextual messages for others

### 3B. Clients

**List page:**
- Table: row padding `py-3.5 px-4`, rows as `<a>` links, search with loading spinner
- Empty state: already uses `EmptyState` — keep as-is

**Detail page:**
- Client name: `text-2xl font-semibold`
- Contact info card: `rounded-xl`
- Stats to tabs separation: `mt-8`
- Stat cards: consistent `gap-6` between them
- Tab section headings: `text-lg font-semibold`

**Tab components (policies, claims, tasks, documents, notes, activity):**
- All empty states → `EmptyState` component with contextual descriptions
- All dialog forms: required field markers, submit loading spinners, dialog close prevention
- Consistent card/list spacing within tabs

**Client form (new + edit):**
- Required field asterisks
- Form sections: `gap-6`
- Submit button with loading state
- Card wrapper: `rounded-xl`

### 3C. Tasks

**List page:**
- Same table treatment as clients: `<a>` link rows, `py-3.5 px-4` padding, search loading
- Filter tabs: consistent spacing
- Create task dialog: submission safety + loading

**Detail page:**
- Task title: `text-2xl font-semibold`
- Description: proper `text-sm` body text
- Sidebar "Details" card heading: `text-lg font-semibold`
- Status change buttons: loading states
- Edit/delete modals: submission safety

### 3D. Documents

- Table: same spacing and link treatment
- Search + tag filter: loading indicators
- Add empty state for "no documents matching filter"

### 3E. Settings

**Layout:**
- Tab bar: consistent typography, active tab underline 3px thick
- Each settings page gets a subtitle description under the page title

**Profile:**
- Submit button loading state
- Card: `rounded-xl`
- Required field markers

**Members:**
- Table with role badges
- Invite form card: `rounded-xl`, loading on invite button
- Empty state for no members (edge case)

**Organisation:**
- Org guard card: `rounded-xl`, better description text
- Create org form: required markers, loading state

**Security:**
- Clear visual separation between password change and 2FA sections
- Section headings: `text-lg font-semibold`
- Loading states on all buttons

### 3F. Auth Pages

- All auth pages: `rounded-xl` card, centred layout
- Title: `text-2xl font-semibold text-center`
- Subtitle: `text-sm text-muted-foreground text-center`
- Form fields: `gap-4`
- Submit buttons: loading spinners
- Error banners: icon prefix (`AlertCircle`)
- Social login buttons: consistent outline variant, icon + text

### 3G. Landing Page

- Apply same `rounded-xl` card radius
- Match typography scale
- Match button styles
- Light touch — consistency only, no redesign

---

## Out of Scope

- Skeleton loaders (SSR provides data on load)
- Client-side form validation (keep server-side only)
- Mobile-specific table card views (tables scroll horizontally, which is acceptable)
- Bottom tab bar for mobile nav
- Breadcrumb navigation
- Settings overview/dashboard page
- Micro-interactions beyond hover transitions and loading spinners
- New components or features
