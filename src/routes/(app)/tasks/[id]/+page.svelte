<script lang="ts">
	import { enhance } from '$app/forms';
	import { APP_NAME } from '$lib/config';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import TaskStatusBadge from '$lib/components/tasks/task-status-badge.svelte';
	import TaskPriorityBadge from '$lib/components/tasks/task-priority-badge.svelte';
	import { TASK_PRIORITIES } from '$lib/types';
	import type { TaskStatus, TaskPriority } from '$lib/types';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import X from '@lucide/svelte/icons/x';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let editMode = $state(false);
	let editPriority = $state('medium');

	// Sync edit priority from data
	$effect(() => {
		editPriority = data.task.priority;
	});

	function formatDate(d: string | Date | null | undefined): string {
		if (!d) return '—';
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function toInputDate(d: string | Date | null | undefined): string {
		if (!d) return '';
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toISOString().slice(0, 10);
	}

	function isOverdue(d: string | Date | null | undefined, status: string): boolean {
		if (!d || status === 'done') return false;
		const date = typeof d === 'string' ? new Date(d) : d;
		return date < new Date();
	}
</script>

<svelte:head>
	<title>{data.task.title} — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<!-- Back link -->
		<div>
			<Button variant="ghost" size="sm" href="/tasks" class="-ml-2">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Tasks
			</Button>
		</div>

		<!-- Header -->
		<PageHeader title={data.task.title}>
			{#snippet actions()}
				<div class="flex items-center gap-2">
					<TaskStatusBadge status={data.task.status as TaskStatus} />
					<TaskPriorityBadge priority={data.task.priority as TaskPriority} />
					{#if !editMode}
						<Button variant="outline" onclick={() => (editMode = true)}>
							<Pencil class="mr-2 h-4 w-4" />
							Edit
						</Button>
					{:else}
						<Button variant="ghost" onclick={() => (editMode = false)}>
							<X class="mr-2 h-4 w-4" />
							Cancel
						</Button>
					{/if}
				</div>
			{/snippet}
		</PageHeader>

		<!-- Quick status change -->
		<div class="flex flex-wrap gap-2">
			<span class="self-center text-sm text-muted-foreground">Change status:</span>
			{#each ['todo', 'in_progress', 'done'] as s}
				<form
					method="POST"
					action="?/updateStatus"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<input type="hidden" name="status" value={s} />
					<Button
						type="submit"
						size="sm"
						variant={data.task.status === s ? 'default' : 'outline'}
					>
						{s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done'}
					</Button>
				</form>
			{/each}
		</div>

		{#if form?.error}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<!-- Two-column layout -->
		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Main content (left / 2 cols) -->
			<div class="lg:col-span-2">
				{#if editMode}
					<!-- Edit form -->
					<Card>
						<CardHeader>
							<CardTitle>Edit Task</CardTitle>
						</CardHeader>
						<CardContent>
							<form
								method="POST"
								action="?/update"
								use:enhance={() => {
									return async ({ result, update }) => {
										await update();
										if (result.type === 'success') editMode = false;
									};
								}}
								class="space-y-4"
							>
								<div class="grid gap-2">
									<Label for="title">Title</Label>
									<Input
										id="title"
										name="title"
										required
										value={data.task.title}
									/>
								</div>

								<div class="grid gap-2">
									<Label for="description">Description</Label>
									<Textarea
										id="description"
										name="description"
										rows={4}
										value={data.task.description ?? ''}
										placeholder="Optional details..."
									/>
								</div>

								<div class="grid gap-4 sm:grid-cols-2">
									<div class="grid gap-2">
										<Label>Priority</Label>
										<Select.Root
											type="single"
											name="priority"
											value={editPriority}
											onValueChange={(v) => (editPriority = v)}
										>
											<Select.Trigger class="w-full">
												{editPriority.charAt(0).toUpperCase() + editPriority.slice(1)}
											</Select.Trigger>
											<Select.Content>
												{#each TASK_PRIORITIES as p}
													<Select.Item value={p}>
														{p.charAt(0).toUpperCase() + p.slice(1)}
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
									<div class="grid gap-2">
										<Label for="dueDate">Due Date</Label>
										<Input
											id="dueDate"
											name="dueDate"
											type="date"
											value={toInputDate(data.task.dueDate)}
										/>
									</div>
								</div>

								<div class="flex gap-2">
									<Button type="submit">Save Changes</Button>
									<Button type="button" variant="outline" onclick={() => (editMode = false)}>
										Cancel
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				{:else}
					<!-- Description view -->
					<Card>
						<CardHeader>
							<CardTitle>Description</CardTitle>
						</CardHeader>
						<CardContent>
							{#if data.task.description}
								<p class="whitespace-pre-wrap text-sm">{data.task.description}</p>
							{:else}
								<p class="text-sm text-muted-foreground">No description provided.</p>
							{/if}
						</CardContent>
					</Card>
				{/if}
			</div>

			<!-- Details sidebar (right / 1 col) -->
			<div>
				<Card>
					<CardHeader>
						<CardTitle>Details</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid gap-1">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Priority
							</p>
							<TaskPriorityBadge priority={data.task.priority as TaskPriority} />
						</div>

						<div class="grid gap-1">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Due Date
							</p>
							<p
								class="text-sm {isOverdue(data.task.dueDate, data.task.status)
									? 'text-destructive'
									: ''}"
							>
								{formatDate(data.task.dueDate)}
							</p>
						</div>

						<div class="grid gap-1">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Client
							</p>
							{#if data.task.clientId && data.task.clientName}
								<a
									href="/clients/{data.task.clientId}"
									class="text-sm text-primary hover:underline"
								>
									{data.task.clientName}
								</a>
							{:else}
								<p class="text-sm text-muted-foreground">—</p>
							{/if}
						</div>

						<div class="grid gap-1">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Created
							</p>
							<p class="text-sm text-muted-foreground">{formatDate(data.task.createdAt)}</p>
						</div>

						{#if data.task.completedAt}
							<div class="grid gap-1">
								<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Completed
								</p>
								<p class="text-sm text-muted-foreground">{formatDate(data.task.completedAt)}</p>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</OrgGuard>
