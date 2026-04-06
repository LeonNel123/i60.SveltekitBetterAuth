# Design & UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten layout, spacing, colour, visual hierarchy, empty states, loading states, and accessibility across the entire BrokerOS app.

**Architecture:** Foundation-Up — global CSS/theme changes first (cascade to all pages), then shared component updates, then page-by-page sweep applying the design system consistently.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind CSS v4, shadcn-svelte, lucide-svelte

**Spec:** `docs/superpowers/specs/2026-04-06-design-ux-refinement-design.md`

---

### Task 1: Foundation — CSS Theme & Skip Link

**Files:**

- Modify: `src/app.css` (lines 6-65 — theme variables)
- Modify: `src/app.html` (add skip link)
- Modify: `src/routes/(app)/+layout.svelte` (add id to main)

- [ ] **Step 1: Bump muted-foreground contrast in app.css**

In `src/app.css`, update the `--muted-foreground` values for better WCAG AA contrast:

```css
/* Light mode — change from oklch(0.552 ...) to darker */
--muted-foreground: oklch(0.486 0.016 285.938);

/* Dark mode — change from oklch(0.705 ...) to brighter */
--muted-foreground: oklch(0.748 0.015 286.067);
```

Also update `--radius` from `0.625rem` to `0.75rem` (12px) to match the rounded-xl card treatment:

```css
--radius: 0.75rem;
```

- [ ] **Step 2: Add skip-to-main link in app.html**

In `src/app.html`, add this as the first child of `<body>`, before `<div id="svelte">`:

```html
<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
	>Skip to main content</a
>
```

- [ ] **Step 3: Add id="main-content" to main element**

In `src/routes/(app)/+layout.svelte`, change:

```svelte
<main class="flex-1 p-6">
```

to:

```svelte
<main id="main-content" class="flex-1 p-6">
```

- [ ] **Step 4: Commit**

```bash
git add src/app.css src/app.html src/routes/(app)/+layout.svelte
git commit -m "style: bump muted-foreground contrast, increase radius, add skip-to-main link"
```

---

### Task 2: Foundation — Empty State Component

**Files:**

- Modify: `src/lib/components/shared/empty-state.svelte`

- [ ] **Step 1: Refine EmptyState component**

Update `src/lib/components/shared/empty-state.svelte` — softer container (background instead of dashed border), slightly larger icon, better spacing:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ComponentType } from 'svelte';

	let {
		icon: Icon,
		title,
		description,
		action
	}: {
		icon?: ComponentType;
		title: string;
		description?: string;
		action?: Snippet;
	} = $props();
</script>

<div class="flex flex-col items-center justify-center rounded-xl bg-muted/40 p-16 text-center">
	{#if Icon}
		<div class="mb-4 rounded-full bg-muted p-4">
			<Icon class="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
		</div>
	{/if}
	<h3 class="text-lg font-semibold">{title}</h3>
	{#if description}
		<p class="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
	{/if}
	{#if action}
		<div class="mt-5">
			{@render action()}
		</div>
	{/if}
</div>
```

Changes from current:

- Container: `border border-dashed` → `bg-muted/40` (softer, no dashed border)
- Container: `rounded-lg` → `rounded-xl`
- Icon wrapper: `p-3` → `p-4` (slightly larger touch target)
- Icon: add `aria-hidden="true"`
- Description: `mt-1.5` → `mt-2`

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/shared/empty-state.svelte
git commit -m "style: refine EmptyState component — softer bg, rounded-xl, aria-hidden icon"
```

---

### Task 3: Dashboard Sweep

**Files:**

- Modify: `src/routes/(app)/dashboard/+page.svelte`
- Modify: `src/lib/utils/format.ts` (renewal urgency helper)

- [ ] **Step 1: Fix renewal urgency colours in format.ts**

In `src/lib/utils/format.ts`, find the `renewalRowClass` or equivalent urgency function (used by dashboard). The dashboard currently uses inline logic at lines 31-41. If the urgency colour logic is inline in the dashboard, we'll fix it there in step 2. But first check `format.ts` for any yellow colour references and replace `text-yellow-600 dark:text-yellow-400` with `text-orange-600 dark:text-orange-400` and `border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10` with `border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10`.

- [ ] **Step 2: Sweep dashboard page**

Apply these changes to `src/routes/(app)/dashboard/+page.svelte`:

**Page header (line 52):**

```svelte
<!-- FROM -->
<h1 class="text-3xl font-bold tracking-tight">Command Centre</h1>
<!-- TO -->
<h1 class="text-2xl font-semibold tracking-tight">Command Centre</h1>
```

**Page subtitle (line 53):**

```svelte
<!-- FROM -->
<p class="mt-1 text-muted-foreground">
<!-- TO -->
<p class="mt-1 text-sm text-muted-foreground">
```

**KPI cards grid (line 63):**

```svelte
<!-- FROM -->
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
<!-- TO -->
<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
```

**KPI card containers — each Card (lines 65, 84, 97, 110):**
Add `rounded-xl` to each Card class.

**KPI stat labels — each CardTitle (lines 69, 88, 101, 114):**

```svelte
<!-- FROM -->
<CardTitle class="text-sm font-medium text-muted-foreground">
<!-- TO -->
<CardTitle class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
```

**KPI stat values — ensure text-3xl font-bold (lines ~74, ~91, ~104, ~117):**

```svelte
<p class="text-3xl font-bold">{value}</p>
```

**Section grid (line 130):**

```svelte
<!-- FROM -->
<div class="grid gap-6 lg:grid-cols-2">
<!-- TO -->
<div class="mt-6 grid gap-6 lg:grid-cols-2">
```

**Section headings — My Tasks, Overdue, Renewing Soon, Activity (CardTitle instances around lines 135, 181, 224, 274):**

```svelte
<!-- FROM -->
<CardTitle class="text-base">My Tasks</CardTitle>
<!-- TO -->
<CardTitle class="text-lg font-semibold">My Tasks</CardTitle>
```

Apply same pattern to all four section titles.

**Card wrappers for sections:**
Add `rounded-xl` to each Card.

**Task items padding (lines ~146, ~195):**

```svelte
<!-- FROM -->
class="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
<!-- TO -->
class="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
```

**Empty task states — replace plain text (lines 140-143, 187-190) with EmptyState:**

Import EmptyState and relevant icons at top of script:

```svelte
import EmptyState from '$lib/components/shared/empty-state.svelte'; import {(CheckCircle,
ClipboardList)} from 'lucide-svelte';
```

Replace the My Tasks empty state:

```svelte
<!-- FROM -->
<div class="flex flex-col items-center justify-center py-8 text-center">
	<ClipboardList class="mb-2 h-8 w-8 text-muted-foreground/40" />
	<p class="text-sm text-muted-foreground">No tasks assigned to you</p>
</div>
<!-- TO -->
<EmptyState
	icon={ClipboardList}
	title="No tasks assigned"
	description="Tasks assigned to you will appear here."
/>
```

Replace the Overdue empty state:

```svelte
<!-- FROM -->
<div class="flex flex-col items-center justify-center py-8 text-center">
	<CheckCircle class="mb-2 h-8 w-8 text-muted-foreground/40" />
	<p class="text-sm text-muted-foreground">No overdue tasks</p>
</div>
<!-- TO -->
<EmptyState
	icon={CheckCircle}
	title="You're all caught up"
	description="No overdue tasks right now."
/>
```

**Renewal urgency — replace yellow with orange (lines 37-41 area):**

Find the urgency colour function and change:

```svelte
<!-- FROM -->
return 'text-yellow-600 dark:text-yellow-400';
<!-- TO -->
return 'text-orange-600 dark:text-orange-400';
```

And the row class:

```svelte
<!-- FROM -->
'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10'
<!-- TO -->
'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10'
```

**Renewal empty state — add EmptyState if missing.**

**Activity section — add EmptyState if missing.**

- [ ] **Step 3: Commit**

```bash
git add src/routes/(app)/dashboard/+page.svelte src/lib/utils/format.ts
git commit -m "style: dashboard — typography, spacing, KPI cards, empty states, fix yellow contrast"
```

---

### Task 4: Client List Page Sweep

**Files:**

- Modify: `src/routes/(app)/clients/+page.svelte`

- [ ] **Step 1: Fix table row semantics and spacing**

In `src/routes/(app)/clients/+page.svelte`:

**Replace the table row button pattern (lines 115-123).** Change from `role="button"` to semantic `<a>` in the name cell:

```svelte
<!-- FROM -->
<TableRow
  class="cursor-pointer hover:bg-muted/50"
  onclick={() => goto(resolve(`/clients/${c.id}`))}
  onkeydown={(e: KeyboardEvent) => {
    if (e.key === 'Enter') goto(resolve(`/clients/${c.id}`));
  }}
  role="button"
  tabindex={0}
>
  <TableCell class="font-medium">{c.name}</TableCell>
<!-- TO -->
<TableRow class="cursor-pointer hover:bg-muted/50 transition-colors">
  <TableCell class="py-3.5 font-medium">
    <a href={resolve(`/clients/${c.id}`)} class="hover:underline">{c.name}</a>
  </TableCell>
```

Remove `onclick`, `onkeydown`, `role`, `tabindex` from all TableRow elements.

**Add `py-3.5` to all TableCell elements** for consistent row padding:

```svelte
<TableCell class="py-3.5 text-muted-foreground">
```

**Add search loading indicator.** Add a `searching` state variable:

```svelte
let searching = $state(false);
```

In the `handleSearch` function, set `searching = true` before the timeout and `searching = false` in the `afterNavigate` or after `goto`:

```svelte
function handleSearch() {
  clearTimeout(searchTimeout);
  searching = true;
  searchTimeout = setTimeout(() => {
    goto(buildRelativeUrl(page.url.pathname, page.url.searchParams, { search: searchValue || null, page: null }), {
      keepFocus: true,
      replaceState: true
    }).finally(() => { searching = false; });
  }, 300);
}
```

Add the spinner in the search input container — replace the static search icon with a conditional:

```svelte
{#if searching}
	<LoaderCircle
		class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
	/>
{:else}
	<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
{/if}
```

Import `LoaderCircle` from `lucide-svelte`.

- [ ] **Step 2: Commit**

```bash
git add src/routes/(app)/clients/+page.svelte
git commit -m "style: client list — semantic link rows, table padding, search loading indicator"
```

---

### Task 5: Client Detail Page Sweep

**Files:**

- Modify: `src/routes/(app)/clients/[id]/+page.svelte`

- [ ] **Step 1: Typography and spacing refinements**

In `src/routes/(app)/clients/[id]/+page.svelte`:

**Page title** — the PageHeader component likely uses its own h1. Check if it uses `text-3xl`. If the title class is passed or inherited, ensure it renders as `text-2xl font-semibold tracking-tight`.

**Contact info card (line ~69):**

```svelte
<!-- Add rounded-xl to the Card -->
<Card class="rounded-xl">
```

**Stats-to-tabs separation (before tabs, around line 188):**

```svelte
<!-- FROM -->
<Tabs.Root ...>
<!-- TO (add margin) -->
<Tabs.Root class="mt-8" ...>
```

**Stat cards grid (line ~140):**

```svelte
<!-- FROM -->
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
<!-- TO -->
<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
```

**Stat card wrappers** — add `rounded-xl` to each Card.

**Tab content spacing (line ~222 area):**

```svelte
<!-- FROM -->
<Tabs.Content ... class="mt-4">
<!-- TO -->
<Tabs.Content ... class="mt-6">
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/(app)/clients/[id]/+page.svelte
git commit -m "style: client detail — rounded-xl cards, spacing, typography hierarchy"
```

---

### Task 6: Client Tab Components Sweep

**Files:**

- Modify: `src/lib/components/clients/notes-tab.svelte`
- Modify: `src/lib/components/clients/policies-tab.svelte`
- Modify: `src/lib/components/clients/claims-tab.svelte`
- Modify: `src/lib/components/clients/tasks-tab.svelte`
- Modify: `src/lib/components/clients/documents-tab.svelte`
- Modify: `src/lib/components/clients/activity-tab.svelte`

- [ ] **Step 1: Fix notes-tab empty state**

In `src/lib/components/clients/notes-tab.svelte`, replace the plain text empty state (line ~65):

```svelte
<!-- FROM -->
{#if notes.length === 0}
  <p class="py-8 text-center text-sm text-muted-foreground">
    No notes yet. Add one above to get started.
  </p>
<!-- TO -->
{#if notes.length === 0}
  <EmptyState
    icon={StickyNote}
    title="No notes yet"
    description="Add notes to track conversations, decisions, and follow-ups with this client."
  />
```

Import `EmptyState` and `StickyNote` from lucide-svelte.

- [ ] **Step 2: Fix policies-tab dialog safety and empty state**

In `src/lib/components/clients/policies-tab.svelte`:

**Dialog close prevention** — in the `enhance` callback, ensure `dialogOpen` is only set to `false` after confirmed success:

```svelte
<!-- In the enhance function, ensure dialog doesn't close on error -->
enhance: () => {
  loading = true;
  return async ({ result, update }) => {
    loading = false;
    if (result.type === 'success') {
      dialogOpen = false;
      toast.success(editingPolicy ? 'Policy updated' : 'Policy added');
      await update();
    } else if (result.type === 'failure') {
      await update();
    }
  };
}
```

**Add required field markers** to the form labels. For each required field label in the dialog form:

```svelte
<!-- FROM -->
<Label for="policyNumber">Policy Number</Label>
<!-- TO -->
<Label for="policyNumber">Policy Number <span class="text-destructive">*</span></Label>
```

Apply to all required fields: policyNumber, insurer, type, status, startDate, endDate, premium.

**Card rounded-xl** — add `rounded-xl` to any wrapping Card if present.

- [ ] **Step 3: Fix claims-tab**

In `src/lib/components/clients/claims-tab.svelte`:

**Empty state** — if using plain `<p>` tag, replace with:

```svelte
<EmptyState
	icon={FileWarning}
	title="No claims yet"
	description="Claims filed against this client's policies will appear here."
/>
```

Import `EmptyState` from `$lib/components/shared/empty-state.svelte` and `FileWarning` from `lucide-svelte`.

**Dialog close prevention** — in the enhance callback, ensure dialog only closes on success:

```svelte
enhance: () => {
  loading = true;
  return async ({ result, update }) => {
    loading = false;
    if (result.type === 'success') {
      dialogOpen = false;
      toast.success(editingClaim ? 'Claim updated' : 'Claim added');
      await update();
    } else if (result.type === 'failure') {
      await update();
    }
  };
}
```

**Required field markers** — add `<span class="text-destructive">*</span>` after each required field label (claim number, policy, status, amount claimed, date of loss).

- [ ] **Step 4: Fix tasks-tab — empty state**

In `src/lib/components/clients/tasks-tab.svelte`:

**Empty state** — replace any plain `<p>` tag with:

```svelte
<EmptyState
	icon={ClipboardList}
	title="No tasks yet"
	description="Tasks related to this client will appear here. Create one from the Tasks page."
/>
```

Import `EmptyState` from `$lib/components/shared/empty-state.svelte` and `ClipboardList` from `lucide-svelte`.

- [ ] **Step 5: Fix documents-tab — empty state and dialog safety**

In `src/lib/components/clients/documents-tab.svelte`:

**Empty state** — replace any plain `<p>` tag with:

```svelte
<EmptyState
	icon={FileText}
	title="No documents yet"
	description="Upload documents like policy schedules, claims forms, and KYC records for this client."
/>
```

Import `EmptyState` from `$lib/components/shared/empty-state.svelte` and `FileText` from `lucide-svelte`.

**Dialog close prevention** — in the upload dialog's enhance callback, ensure dialog only closes on confirmed success (same pattern as policies/claims).

- [ ] **Step 6: Fix activity-tab — empty state**

Ensure activity-tab uses `EmptyState` component for empty state.

Import `Activity` icon from lucide-svelte:

```svelte
<EmptyState
	icon={Activity}
	title="No activity yet"
	description="Actions on this client's policies, claims, and tasks will appear here."
/>
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/clients/notes-tab.svelte src/lib/components/clients/policies-tab.svelte src/lib/components/clients/claims-tab.svelte src/lib/components/clients/tasks-tab.svelte src/lib/components/clients/documents-tab.svelte src/lib/components/clients/activity-tab.svelte
git commit -m "style: client tabs — EmptyState everywhere, dialog safety, required field markers"
```

---

### Task 7: Client Form Sweep

**Files:**

- Modify: `src/lib/components/clients/client-form.svelte`

- [ ] **Step 1: Add required markers and spacing**

In `src/lib/components/clients/client-form.svelte`:

**Required field markers** — add `<span class="text-destructive">*</span>` to required field labels (name is required, others may vary):

```svelte
<Label for="name">
	{clientType === 'individual' ? 'Full Name' : 'Company Name'}
	<span class="text-destructive">*</span>
</Label>
```

**Form spacing** — ensure the form uses `gap-6` between sections:

```svelte
<!-- FROM (if using space-y-4 or gap-4) -->
<div class="space-y-4">
<!-- TO -->
<div class="space-y-6">
```

**Error banner** — add AlertCircle icon prefix:

```svelte
<!-- FROM -->
<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
	{form?.error}
</div>
<!-- TO -->
<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
	<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
	<span>{form?.error}</span>
</div>
```

Import `AlertCircle` from `lucide-svelte`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/clients/client-form.svelte
git commit -m "style: client form — required markers, spacing, error icon"
```

---

### Task 8: Task Pages Sweep

**Files:**

- Modify: `src/routes/(app)/tasks/+page.svelte`
- Modify: `src/routes/(app)/tasks/[id]/+page.svelte`

- [ ] **Step 1: Task list — table rows, search loading, dialog safety**

In `src/routes/(app)/tasks/+page.svelte`:

**Table row semantics (lines 165-173)** — same fix as client list. Replace `role="button"` with semantic `<a>` in the title cell:

```svelte
<!-- FROM -->
<TableRow
  class="cursor-pointer hover:bg-muted/50"
  onclick={() => goto(resolve(`/tasks/${t.id}`))}
  onkeydown={(e: KeyboardEvent) => {
    if (e.key === 'Enter') goto(resolve(`/tasks/${t.id}`));
  }}
  role="button"
  tabindex={0}
>
  <TableCell class="font-medium">
    <span class="truncate">{t.title}</span>
  </TableCell>
<!-- TO -->
<TableRow class="cursor-pointer hover:bg-muted/50 transition-colors">
  <TableCell class="py-3.5 font-medium">
    <a href={resolve(`/tasks/${t.id}`)} class="hover:underline">{t.title}</a>
  </TableCell>
```

Add `py-3.5` to all other TableCell elements.

**Search loading** — same pattern as client list:

```svelte
let searching = $state(false);
```

Add spinner toggle in handleSearch function and conditional icon in search input. Import `LoaderCircle`.

**Create dialog safety** — ensure `createDialogOpen` is only set to `false` on confirmed success in the enhance callback:

```svelte
enhance: () => {
  createLoading = true;
  return async ({ result, update }) => {
    createLoading = false;
    if (result.type === 'success') {
      createDialogOpen = false;
      toast.success('Task created');
      await update();
    } else if (result.type === 'failure') {
      await update();
    }
  };
}
```

**Required field markers** in create dialog:

```svelte
<Label for="title">Title <span class="text-destructive">*</span></Label>
```

**Empty state** — if task list uses plain text empty state, replace with EmptyState component.

- [ ] **Step 2: Task detail — typography, loading states**

In `src/routes/(app)/tasks/[id]/+page.svelte`:

**Sidebar "Details" heading (line ~235):**

```svelte
<!-- FROM -->
<CardTitle class="text-base">Details</CardTitle>
<!-- TO -->
<CardTitle class="text-lg font-semibold">Details</CardTitle>
```

**Description card heading:**

```svelte
<!-- FROM -->
<CardTitle class="text-base">Description</CardTitle>
<!-- TO -->
<CardTitle class="text-lg font-semibold">Description</CardTitle>
```

**Card wrappers** — add `rounded-xl` to Cards.

**Status change button loading** — ensure each status form button shows loading state properly with disabled state.

**Edit form error banner** — add AlertCircle icon:

```svelte
<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
	<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
	<span>{form?.error}</span>
</div>
```

**Detail sidebar labels (Priority, Due Date, etc.):**

```svelte
<!-- FROM -->
<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
<!-- Verify these already use this pattern, if not, update to: -->
<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/(app)/tasks/+page.svelte src/routes/(app)/tasks/[id]/+page.svelte
git commit -m "style: task pages — semantic links, table padding, dialog safety, typography"
```

---

### Task 9: Documents Page Sweep

**Files:**

- Modify: `src/routes/(app)/documents/+page.svelte`

- [ ] **Step 1: Table padding and empty states**

In `src/routes/(app)/documents/+page.svelte`:

**Table cell padding** — add `py-3.5` to all TableCell elements.

**Empty state for no-match** — if there's no empty state when filtering by tag yields zero results, add one:

```svelte
{#if data.documents.length === 0}
  <EmptyState
    icon={FileText}
    title={data.search || data.tag ? 'No documents found' : 'No documents yet'}
    description={data.search || data.tag
      ? 'Try adjusting your search or filter.'
      : 'Documents uploaded to clients will appear here.'}
  />
{:else}
```

Import `EmptyState` and `FileText`.

**Search loading** — add searching state and spinner icon, same pattern as clients/tasks.

- [ ] **Step 2: Commit**

```bash
git add src/routes/(app)/documents/+page.svelte
git commit -m "style: documents — table padding, empty state, search loading"
```

---

### Task 10: Settings Pages Sweep

**Files:**

- Modify: `src/routes/(app)/settings/+layout.svelte`
- Modify: `src/routes/(app)/settings/profile/+page.svelte`
- Modify: `src/routes/(app)/settings/members/+page.svelte`
- Modify: `src/routes/(app)/settings/organization/+page.svelte`
- Modify: `src/routes/(app)/settings/security/+page.svelte`

- [ ] **Step 1: Settings layout — tab bar refinement**

In `src/routes/(app)/settings/+layout.svelte`:

**Active tab underline** — make it slightly thicker:

```svelte
<!-- FROM -->
border-b-2
<!-- TO -->
border-b-[3px]
```

- [ ] **Step 1b: Add page subtitles to settings pages**

Each settings page should include a description below the CardTitle. These will be added in subsequent steps for each page:

- Profile: "Manage your display name and personal details."
- Organisation: "Create, switch, or manage your organisation."
- Members: "Invite team members and manage roles."
- Security: "Password, two-factor authentication, and account security."

- [ ] **Step 2: Profile page — loading state and card**

In `src/routes/(app)/settings/profile/+page.svelte`:

**Card:** Add `rounded-xl`.

**Submit button loading:**

```svelte
<!-- FROM -->
<Button type="submit" class="w-fit">Save changes</Button>
<!-- TO -->
<Button type="submit" class="w-fit" disabled={false}>Save changes</Button>
```

Since this uses `use:enhance`, add a loading state variable:

```svelte
let saving = $state(false);
```

Wire it up in the enhance callback and update the button:

```svelte
<Button type="submit" class="w-fit" disabled={saving}>
	{saving ? 'Saving...' : 'Save changes'}
</Button>
```

**Error banner** — add AlertCircle icon prefix (same pattern as client form).

**Required field marker** on Name field:

```svelte
<Label for="name">Name <span class="text-destructive">*</span></Label>
```

- [ ] **Step 3: Members page — card and empty state**

In `src/routes/(app)/settings/members/+page.svelte`:

**Cards:** Add `rounded-xl` to both members and invite cards.

**Empty state** — replace plain text with something slightly better:

```svelte
<!-- FROM -->
<p class="py-4 text-center text-sm text-muted-foreground">No members found.</p>
<!-- TO -->
<TableRow>
	<TableCell colspan={3} class="py-8 text-center text-sm text-muted-foreground">
		No members found.
	</TableCell>
</TableRow>
```

**Invite button loading:**

```svelte
<Button type="submit" disabled={inviteLoading}>
	{inviteLoading ? 'Sending...' : 'Send Invite'}
</Button>
```

**Error banner** — add AlertCircle icon prefix.

- [ ] **Step 4: Organisation page — card and loading**

In `src/routes/(app)/settings/organization/+page.svelte`:

**Cards:** Add `rounded-xl` to all Card instances.

**Create org form** — add required marker on Name:

```svelte
<Label for="name">Organisation Name <span class="text-destructive">*</span></Label>
```

**Submit button loading** — if not already present, add:

```svelte
let creating = $state(false);
```

Wire in enhance callback.

**Error banner** — add AlertCircle icon prefix.

- [ ] **Step 5: Security page — section headings and loading**

In `src/routes/(app)/settings/security/+page.svelte`:

**Cards:** Add `rounded-xl` to both cards (2FA and password change).

**Section separation** — ensure there's `gap-6` or `space-y-6` between the two cards.

**Password change button loading** — if not already showing loading state, add it:

```svelte
<Button onclick={handlePasswordChange} disabled={changingPassword}>
	{changingPassword ? 'Changing...' : 'Change Password'}
</Button>
```

**Error banners** — add AlertCircle icon prefix to both error displays.

- [ ] **Step 6: Commit**

```bash
git add src/routes/(app)/settings/+layout.svelte src/routes/(app)/settings/profile/+page.svelte src/routes/(app)/settings/members/+page.svelte src/routes/(app)/settings/organization/+page.svelte src/routes/(app)/settings/security/+page.svelte
git commit -m "style: settings — rounded-xl cards, loading states, required markers, error icons"
```

---

### Task 11: Auth Pages Sweep

**Files:**

- Modify: `src/routes/(auth)/+layout.svelte`
- Modify: `src/routes/(auth)/login/+page.svelte`
- Modify: `src/routes/(auth)/register/+page.svelte`
- Modify: `src/routes/(auth)/forgot-password/+page.svelte`
- Modify: `src/routes/(auth)/reset-password/+page.svelte`
- Modify: `src/routes/(auth)/verify-email/+page.svelte`
- Modify: `src/routes/(auth)/two-factor/+page.svelte`

- [ ] **Step 1: Auth layout**

In `src/routes/(auth)/+layout.svelte`, no changes needed — the `max-w-md` and centering are already good.

- [ ] **Step 2: Login page**

In `src/routes/(auth)/login/+page.svelte`:

**Card:** Add `rounded-xl` to the Card component.

**Title:** Ensure it uses `text-2xl font-semibold text-center` (currently `text-2xl` — verify and add `font-semibold text-center` if missing).

**Error banner** — add AlertCircle icon prefix:

```svelte
<!-- FROM -->
<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
	{form?.error}
</div>
<!-- TO -->
<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
	<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
	<span>{form?.error}</span>
</div>
```

Import `AlertCircle` from `lucide-svelte`.

**Submit button** — verify it shows loading state. Currently shows "Signing in..." — good. Ensure it's disabled during submission.

**Form field spacing** — verify `gap-4` between fields. If using `space-y-4`, keep as-is (equivalent).

- [ ] **Step 3: Register page**

In `src/routes/(auth)/register/+page.svelte`:

Same changes as login:

- Card: `rounded-xl`
- Error banner: AlertCircle icon prefix
- Verify loading state on submit button
- Import AlertCircle

**Required markers:**

```svelte
<Label for="name">Name <span class="text-destructive">*</span></Label>
<Label for="email">Email <span class="text-destructive">*</span></Label>
<Label for="password">Password <span class="text-destructive">*</span></Label>
```

- [ ] **Step 4: Forgot password page**

In `src/routes/(auth)/forgot-password/+page.svelte`:

- Card: `rounded-xl`
- Error banner: AlertCircle icon prefix
- Verify submit loading state ("Sending...")

- [ ] **Step 5: Reset password page**

In `src/routes/(auth)/reset-password/+page.svelte`:

- Card: `rounded-xl`
- Error banner: AlertCircle icon prefix
- Verify submit loading state ("Resetting...")

- [ ] **Step 6: Verify email page**

In `src/routes/(auth)/verify-email/+page.svelte`:

- Card: `rounded-xl`
- Error banner: AlertCircle icon prefix

- [ ] **Step 7: Two-factor page**

In `src/routes/(auth)/two-factor/+page.svelte`:

- Card: `rounded-xl`
- Error banner: AlertCircle icon prefix

- [ ] **Step 8: Commit**

```bash
git add src/routes/(auth)/login/+page.svelte src/routes/(auth)/register/+page.svelte src/routes/(auth)/forgot-password/+page.svelte src/routes/(auth)/reset-password/+page.svelte src/routes/(auth)/verify-email/+page.svelte src/routes/(auth)/two-factor/+page.svelte
git commit -m "style: auth pages — rounded-xl cards, error icons, required markers"
```

---

### Task 12: Landing Page & Org Guard Sweep

**Files:**

- Modify: `src/routes/(marketing)/+page.svelte`
- Modify: `src/lib/components/shared/org-guard.svelte`

- [ ] **Step 1: Landing page — light touch**

In `src/routes/(marketing)/+page.svelte`:

**Hero title:**

```svelte
<!-- Verify it uses proper tracking. If text-5xl, keep as-is for landing page (bigger is fine here). -->
```

**Feature cards** — if wrapped in any Card component, add `rounded-xl`. If just divs, ensure consistent spacing with the app.

No major changes — just consistency pass.

- [ ] **Step 2: Org guard — card refinement**

In `src/lib/components/shared/org-guard.svelte`:

**Card:** Add `rounded-xl` class.

**Icon size** — standardise with empty-state pattern:

```svelte
<!-- FROM (if h-12 w-12) -->
<Building2 class="h-12 w-12 text-muted-foreground/50" />
<!-- TO -->
<Building2 class="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
```

**Description** — make more helpful:

```svelte
<!-- FROM -->
<CardDescription>You need to create or join an organisation to use BrokerOS.</CardDescription>
<!-- TO -->
<CardDescription
	>Create or join an organisation to start managing clients, policies, and tasks.</CardDescription
>
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/(marketing)/+page.svelte src/lib/components/shared/org-guard.svelte
git commit -m "style: landing page consistency, org-guard card refinement"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run type check**

```bash
pnpm check
```

Expected: No type errors from our changes (we only changed CSS classes, HTML structure, and added state variables).

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: No lint errors. Fix any that appear (likely formatting issues).

- [ ] **Step 3: Run format**

```bash
pnpm format
```

- [ ] **Step 4: Run build**

```bash
pnpm build
```

Expected: Successful build. All imports resolve, no missing components.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: fix lint and format after design refinement"
```

- [ ] **Step 6: Visual verification**

Start the dev server with `pnpm dev` and verify:

- Dashboard: KPI cards with rounded-xl, proper typography hierarchy, no yellow text
- Client list: clickable name links, proper table padding
- Client detail: clear section hierarchy, rounded-xl cards
- Tasks: same table fixes, dialog close safety
- Documents: table padding, empty state
- Settings: all cards rounded-xl, loading states on buttons
- Auth pages: rounded-xl cards, error banners with icons
- Dark mode: verify muted-foreground is readable
- Keyboard: Tab through table rows (should focus the `<a>` links)
