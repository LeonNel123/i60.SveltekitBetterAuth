<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { APP_NAME } from '$lib/config';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import TaskStatusBadge from '$lib/components/tasks/task-status-badge.svelte';
	import TaskPriorityBadge from '$lib/components/tasks/task-priority-badge.svelte';
	import TaskTypeBadge from '$lib/components/tasks/task-type-badge.svelte';
	import { TASK_PRIORITIES, TASK_TYPES } from '$lib/types';
	import { taskTypeLabel } from '$lib/tasks';
	import type { TaskStatus, TaskPriority } from '$lib/types';
	import { formatDate, isOverdueDate } from '$lib/utils/format';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let editMode = $state(false);
	let editPriority = $state('medium');
	let editTaskType = $state('general');
	let editLoading = $state(false);
	let deleteDialogOpen = $state(false);
	let deleteLoading = $state(false);

	let members = $derived(page.data.members ?? []);
	let assigneeName = $derived(
		members.find((member: { userId: string }) => member.userId === data.task.assignedToId)?.user
			?.name ?? 'Unassigned'
	);

	$effect(() => {
		editPriority = data.task.priority;
		editTaskType = data.task.taskType;
	});

	function toInputDate(dateValue: string | Date | null | undefined): string {
		if (!dateValue) return '';
		const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
		return date.toISOString().slice(0, 10);
	}
</script>

<svelte:head>
	<title>{data.task.title} — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<div>
			<Button variant="ghost" size="sm" href={resolve('/tasks')} class="-ml-2">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Tasks
			</Button>
		</div>

		<PageHeader title={data.task.title}>
			{#snippet actions()}
				<div class="flex flex-wrap items-center gap-2">
					<TaskTypeBadge taskType={data.task.taskType} />
					<TaskStatusBadge status={data.task.status as TaskStatus} />
					<TaskPriorityBadge priority={data.task.priority as TaskPriority} />
					{#if !editMode}
						<Button variant="outline" onclick={() => (editMode = true)}>
							<Pencil class="mr-2 h-4 w-4" />
							Edit
						</Button>
						<Button variant="destructive" onclick={() => (deleteDialogOpen = true)}>
							<Trash2 class="mr-2 h-4 w-4" />
							Delete
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

		<Card class="rounded-xl">
			<CardContent class="flex flex-wrap items-center gap-3 py-3">
				<span class="text-sm font-medium text-muted-foreground">Status:</span>
				{#each ['todo', 'in_progress', 'done'] as status (status)}
					<form
						method="POST"
						action="?/updateStatus"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') {
									toast.success(
										`Status updated to ${status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done'}`
									);
								}
							};
						}}
					>
						<input type="hidden" name="status" value={status} />
						<Button
							type="submit"
							size="sm"
							variant={data.task.status === status ? 'default' : 'outline'}
						>
							{status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done'}
						</Button>
					</form>
				{/each}
			</CardContent>
		</Card>

		{#if form?.error}
			<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
				<span>{form.error}</span>
			</div>
		{/if}

		<div class="grid gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				{#if editMode}
					<Card class="rounded-xl">
						<CardHeader>
							<CardTitle>Edit Task</CardTitle>
						</CardHeader>
						<CardContent>
							<form
								method="POST"
								action="?/update"
								use:enhance={() => {
									editLoading = true;
									return async ({ result, update }) => {
										editLoading = false;
										await update();
										if (result.type === 'success') {
											editMode = false;
											toast.success('Task updated successfully');
										}
									};
								}}
								class="space-y-4"
							>
								<div class="grid gap-2">
									<Label for="title">Title</Label>
									<Input id="title" name="title" required value={data.task.title} />
								</div>

								<div class="grid gap-2">
									<Label for="description">Description</Label>
									<Textarea
										id="description"
										name="description"
										rows={4}
										value={data.task.description ?? ''}
										placeholder="Operational notes and next action..."
									/>
								</div>

								<div class="grid gap-4 sm:grid-cols-3">
									<div class="grid gap-2">
										<Label>Task Type</Label>
										<Select.Root
											type="single"
											name="taskType"
											value={editTaskType}
											onValueChange={(value) => (editTaskType = value)}
										>
											<Select.Trigger class="w-full">{taskTypeLabel(editTaskType)}</Select.Trigger>
											<Select.Content>
												{#each TASK_TYPES as taskType (taskType)}
													<Select.Item value={taskType}>{taskTypeLabel(taskType)}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>

									<div class="grid gap-2">
										<Label>Priority</Label>
										<Select.Root
											type="single"
											name="priority"
											value={editPriority}
											onValueChange={(value) => (editPriority = value)}
										>
											<Select.Trigger class="w-full">
												{editPriority.charAt(0).toUpperCase() + editPriority.slice(1)}
											</Select.Trigger>
											<Select.Content>
												{#each TASK_PRIORITIES as priority (priority)}
													<Select.Item value={priority}>
														{priority.charAt(0).toUpperCase() + priority.slice(1)}
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
									<Button type="submit" disabled={editLoading}>
										{editLoading ? 'Saving...' : 'Save Changes'}
									</Button>
									<Button type="button" variant="outline" onclick={() => (editMode = false)}>
										Cancel
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				{:else}
					<Card class="rounded-xl">
						<CardHeader>
							<CardTitle class="text-lg font-semibold">Description</CardTitle>
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

			<div>
				<Card class="rounded-xl">
					<CardHeader>
						<CardTitle class="text-lg font-semibold">Details</CardTitle>
					</CardHeader>
					<CardContent class="divide-y">
						<div class="grid gap-1 pb-3">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Task Type
							</p>
							<div>
								<TaskTypeBadge taskType={data.task.taskType} />
							</div>
						</div>

						<div class="grid gap-1 py-3">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Priority
							</p>
							<div>
								<TaskPriorityBadge priority={data.task.priority as TaskPriority} />
							</div>
						</div>

						<div class="grid gap-1 py-3">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Due Date
							</p>
							<p
								class="text-sm font-medium {isOverdueDate(data.task.dueDate, data.task.status)
									? 'text-destructive'
									: ''}"
							>
								{formatDate(data.task.dueDate)}
							</p>
						</div>

						<div class="grid gap-1 py-3">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Assigned To
							</p>
							<p class="mb-1 text-sm font-medium">{assigneeName}</p>
							{#if members.length > 0}
								<form
									id="assign-form"
									method="POST"
									action="?/assign"
									use:enhance={() => {
										return async ({ result, update }) => {
											await update();
											if (result.type === 'success') {
												toast.success('Task reassigned');
											}
										};
									}}
								>
									<input type="hidden" name="assignedToId" value={data.task.assignedToId ?? ''} />
									<Select.Root
										type="single"
										value={data.task.assignedToId ?? ''}
										onValueChange={(value) => {
											const assignForm = document.getElementById('assign-form') as HTMLFormElement;
											const hidden = assignForm?.querySelector(
												'input[name="assignedToId"]'
											) as HTMLInputElement;
											if (hidden) hidden.value = value;
											assignForm?.requestSubmit();
										}}
									>
										<Select.Trigger class="w-full text-xs">Reassign...</Select.Trigger>
										<Select.Content>
											<Select.Item value="unassigned">Unassigned / Triage</Select.Item>
											{#each members as member (member.userId)}
												<Select.Item value={member.userId}>{member.user.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</form>
							{/if}
						</div>

						<div class="grid gap-1 py-3">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Client
							</p>
							{#if data.task.clientId && data.task.clientName}
								<a
									href={resolve(`/clients/${data.task.clientId}`)}
									class="text-sm font-medium text-primary hover:underline"
								>
									{data.task.clientName}
								</a>
							{:else}
								<p class="text-sm text-muted-foreground">Standalone</p>
							{/if}
						</div>

						{#if data.task.policyId}
							<div class="grid gap-1 py-3">
								<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Policy
								</p>
								<p class="text-sm text-muted-foreground">
									{data.task.policyNumber ?? 'Linked policy'}
								</p>
							</div>
						{/if}

						{#if data.task.claimId}
							<div class="grid gap-1 py-3">
								<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Claim
								</p>
								<p class="text-sm text-muted-foreground">
									{data.task.claimNumber ?? 'Linked claim'}
								</p>
							</div>
						{/if}

						<div class="grid gap-1 py-3">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Created
							</p>
							<p class="text-sm text-muted-foreground">{formatDate(data.task.createdAt)}</p>
						</div>

						{#if data.task.completedAt}
							<div class="grid gap-1 pt-3">
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

	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete Task</AlertDialog.Title>
				<AlertDialog.Description>
					Are you sure you want to delete "{data.task.title}"? This action cannot be undone.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						deleteLoading = true;
						return async ({ update }) => {
							deleteLoading = false;
							await update();
						};
					}}
				>
					<AlertDialog.Action
						type="submit"
						class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						disabled={deleteLoading}
					>
						{deleteLoading ? 'Deleting...' : 'Delete'}
					</AlertDialog.Action>
				</form>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</OrgGuard>
