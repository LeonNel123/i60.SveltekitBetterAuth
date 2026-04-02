<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { APP_NAME } from '$lib/config';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import TaskStatusBadge from '$lib/components/tasks/task-status-badge.svelte';
	import TaskPriorityBadge from '$lib/components/tasks/task-priority-badge.svelte';
	import { TASK_PRIORITIES } from '$lib/types';
	import type { TaskStatus, TaskPriority } from '$lib/types';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let searchValue = $state(data.search ?? '');
	let searchTimeout: ReturnType<typeof setTimeout>;
	let createDialogOpen = $state(false);
	let createPriority = $state('medium');

	// Keep searchValue in sync if the page is navigated to with a different search param
	$effect(() => {
		searchValue = data.search ?? '';
	});

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const params = new URLSearchParams(page.url.searchParams);
			if (searchValue.trim()) {
				params.set('q', searchValue.trim());
			} else {
				params.delete('q');
			}
			goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
		}, 300);
	}

	function setFilter(f: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (f === 'all') {
			params.delete('filter');
		} else {
			params.set('filter', f);
		}
		goto(`?${params.toString()}`, { replaceState: true });
	}

	function formatDate(d: string | Date | null | undefined): string {
		if (!d) return '—';
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function isOverdue(d: string | Date | null | undefined, status: string): boolean {
		if (!d || status === 'done') return false;
		const date = typeof d === 'string' ? new Date(d) : d;
		return date < new Date();
	}
</script>

<svelte:head>
	<title>Tasks — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<PageHeader title="Tasks" description="Track and manage your team's work.">
			{#snippet actions()}
				<Button onclick={() => (createDialogOpen = true)}>
					<Plus class="mr-2 h-4 w-4" />
					New Task
				</Button>
			{/snippet}
		</PageHeader>

		<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
			<!-- Filter buttons -->
			<div class="flex gap-2">
				<Button
					variant={data.filter === 'all' ? 'default' : 'outline'}
					size="sm"
					onclick={() => setFilter('all')}
				>
					All
				</Button>
				<Button
					variant={data.filter === 'mine' ? 'default' : 'outline'}
					size="sm"
					onclick={() => setFilter('mine')}
				>
					My Tasks
				</Button>
				<Button
					variant={data.filter === 'overdue' ? 'destructive' : 'outline'}
					size="sm"
					onclick={() => setFilter('overdue')}
				>
					Overdue
				</Button>
			</div>

			<!-- Search -->
			<div class="relative max-w-sm flex-1">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search tasks..."
					class="pl-9"
					bind:value={searchValue}
					oninput={handleSearch}
				/>
			</div>

			{#if data.tasks.length > 0}
				<p class="shrink-0 text-sm text-muted-foreground">
					{data.tasks.length} task{data.tasks.length !== 1 ? 's' : ''}
				</p>
			{/if}
		</div>

		{#if data.tasks.length === 0}
			<EmptyState
				icon={ClipboardList}
				title={data.search ? 'No tasks found' : 'No tasks yet'}
				description={data.search
					? 'Try adjusting your search or filters.'
					: 'Get started by creating your first task.'}
			>
				{#snippet action()}
					{#if !data.search}
						<Button onclick={() => (createDialogOpen = true)}>
							<Plus class="mr-2 h-4 w-4" />
							New Task
						</Button>
					{/if}
				{/snippet}
			</EmptyState>
		{:else}
			<div class="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Priority</TableHead>
							<TableHead>Client</TableHead>
							<TableHead>Due Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.tasks as t (t.id)}
							<TableRow class="cursor-pointer hover:bg-muted/50" onclick={() => goto(`/tasks/${t.id}`)}>
								<TableCell class="font-medium">{t.title}</TableCell>
								<TableCell>
									<TaskStatusBadge status={t.status as TaskStatus} />
								</TableCell>
								<TableCell>
									<TaskPriorityBadge priority={t.priority as TaskPriority} />
								</TableCell>
								<TableCell class="text-muted-foreground">
									{t.clientName ?? '—'}
								</TableCell>
								<TableCell
									class={isOverdue(t.dueDate, t.status) ? 'text-destructive' : 'text-muted-foreground'}
								>
									{formatDate(t.dueDate)}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</div>

	<!-- Create Task Dialog -->
	<Dialog.Root bind:open={createDialogOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>New Task</Dialog.Title>
				<Dialog.Description>Create a standalone task for your organisation.</Dialog.Description>
			</Dialog.Header>

			{#if form?.error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') createDialogOpen = false;
					};
				}}
				class="space-y-4"
			>
				<div class="grid gap-2">
					<Label for="title">Title</Label>
					<Input id="title" name="title" required placeholder="e.g. Follow up on renewal" />
				</div>

				<div class="grid gap-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						placeholder="Optional details..."
						rows={3}
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label>Priority</Label>
						<Select.Root
							type="single"
							name="priority"
							value={createPriority}
							onValueChange={(v) => (createPriority = v)}
						>
							<Select.Trigger class="w-full">
								{createPriority.charAt(0).toUpperCase() + createPriority.slice(1)}
							</Select.Trigger>
							<Select.Content>
								{#each TASK_PRIORITIES as p}
									<Select.Item value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="grid gap-2">
						<Label for="dueDate">Due Date</Label>
						<Input id="dueDate" name="dueDate" type="date" />
					</div>
				</div>

				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => (createDialogOpen = false)}>
						Cancel
					</Button>
					<Button type="submit">Create Task</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</OrgGuard>
