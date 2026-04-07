<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
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
	import TaskTypeBadge from '$lib/components/tasks/task-type-badge.svelte';
	import { TASK_PRIORITIES, TASK_TYPES } from '$lib/types';
	import { taskBoardLabel, taskTypeLabel } from '$lib/tasks';
	import type { TaskStatus, TaskPriority } from '$lib/types';
	import { formatDate, isOverdueDate } from '$lib/utils/format';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import type { PageProps } from './$types';
	import { buildRelativeUrl } from '$lib/utils/query';

	let { data, form }: PageProps = $props();

	let searchValue = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;
	let searching = $state(false);
	let createDialogOpen = $state(false);
	let createPriority = $state('medium');
	let createAssignee = $state('');
	let createTaskType = $state('general');
	let createClientId = $state('');
	let createLoading = $state(false);

	let members = $derived(page.data.members ?? []);
	let activeBoard = $derived(data.boardStats.find((board) => board.key === data.board) ?? null);

	$effect(() => {
		searchValue = data.search ?? '';
	});

	function handleSearch() {
		clearTimeout(searchTimeout);
		searching = true;
		searchTimeout = setTimeout(() => {
			goto(
				buildRelativeUrl(page.url.pathname, page.url.search, {
					q: searchValue.trim() || null
				}),
				{ replaceState: true, keepFocus: true }
			).finally(() => {
				searching = false;
			});
		}, 300);
	}

	function setFilter(filter: string) {
		goto(
			buildRelativeUrl(page.url.pathname, page.url.search, {
				filter: filter === 'all' ? null : filter
			}),
			{ replaceState: true }
		);
	}

	function setBoard(board: string) {
		goto(
			buildRelativeUrl(page.url.pathname, page.url.search, {
				board
			}),
			{ replaceState: true }
		);
	}

	function assigneeLabel(value: string): string {
		if (value === 'unassigned') return 'Unassigned / Triage';
		if (!value) return 'Me (default)';

		return (
			members.find((member: { userId: string }) => member.userId === value)?.user?.name ?? 'Select'
		);
	}

	function clientLabel(value: string): string {
		if (!value) return 'No client linked';
		return data.clients.find((client) => client.id === value)?.name ?? 'Select client';
	}

	function linkedContext(task: {
		clientName?: string | null;
		policyNumber?: string | null;
		claimNumber?: string | null;
	}) {
		if (task.claimNumber) return `Claim ${task.claimNumber}`;
		if (task.policyNumber) return `Policy ${task.policyNumber}`;
		if (task.clientName) return task.clientName;
		return 'Standalone';
	}
</script>

<svelte:head>
	<title>Tasks — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<PageHeader title="Tasks" description="Run operational work through board-based task views.">
			{#snippet actions()}
				<Button onclick={() => (createDialogOpen = true)}>
					<Plus class="mr-2 h-4 w-4" />
					New Task
				</Button>
			{/snippet}
		</PageHeader>

		<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each data.boardStats as board (board.key)}
				<button
					type="button"
					class="rounded-xl border p-4 text-left transition-colors hover:bg-accent/40 {data.board ===
					board.key
						? 'border-primary bg-primary/5 shadow-sm'
						: 'border-border bg-card'}"
					onclick={() => setBoard(board.key)}
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold">{board.label}</p>
							<p class="mt-1 text-xs text-muted-foreground">{board.description}</p>
						</div>
						<div class="rounded-md bg-muted px-2.5 py-1 text-sm font-semibold">{board.count}</div>
					</div>
				</button>
			{/each}
		</div>

		<div class="rounded-xl border bg-card p-4">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="text-sm font-semibold">{activeBoard?.label ?? 'Task Board'}</p>
					<p class="text-sm text-muted-foreground">
						{activeBoard?.description ?? 'Operational task view'}
					</p>
				</div>

				<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div class="flex gap-2">
						<Button
							variant={data.filter === 'all' ? 'default' : 'outline'}
							size="sm"
							onclick={() => setFilter('all')}
						>
							All Open
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

					<div class="relative min-w-[260px] flex-1">
						{#if searching}
							<LoaderCircle
								class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
							/>
						{:else}
							<Search
								class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
							/>
						{/if}
						<Input
							placeholder="Search tasks, notes, or clients..."
							class="pl-9"
							bind:value={searchValue}
							oninput={handleSearch}
						/>
					</div>
				</div>
			</div>
		</div>

		{#if data.tasks.length === 0}
			<EmptyState
				icon={ClipboardList}
				title={data.search ? 'No tasks found' : `No tasks in ${activeBoard?.label ?? 'this board'}`}
				description={data.search
					? 'Try adjusting your search or switching boards.'
					: 'Create a task or move work into this board through task type and linked context.'}
			>
				{#snippet action()}
					<Button onclick={() => (createDialogOpen = true)}>
						<Plus class="mr-2 h-4 w-4" />
						New Task
					</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<div class="overflow-x-auto rounded-xl border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Task</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Priority</TableHead>
							<TableHead>Linked Context</TableHead>
							<TableHead>Assignee</TableHead>
							<TableHead>Due Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.tasks as taskItem (taskItem.id)}
							<TableRow class="cursor-pointer transition-colors hover:bg-muted/50">
								<TableCell class="py-3.5 font-medium">
									<a href={resolve(`/tasks/${taskItem.id}`)} class="block hover:underline">
										<span>{taskItem.title}</span>
										{#if taskItem.clientName}
											<span class="mt-1 block text-xs text-muted-foreground">
												{taskItem.clientName}
											</span>
										{/if}
									</a>
								</TableCell>
								<TableCell class="py-3.5">
									<TaskTypeBadge taskType={taskItem.taskType} />
								</TableCell>
								<TableCell class="py-3.5">
									<TaskStatusBadge status={taskItem.status as TaskStatus} />
								</TableCell>
								<TableCell class="py-3.5">
									<TaskPriorityBadge priority={taskItem.priority as TaskPriority} />
								</TableCell>
								<TableCell class="py-3.5 text-muted-foreground">
									{linkedContext(taskItem)}
								</TableCell>
								<TableCell class="py-3.5 text-muted-foreground">
									{taskItem.assigneeName ?? 'Unassigned'}
								</TableCell>
								<TableCell
									class="py-3.5 {isOverdueDate(taskItem.dueDate, taskItem.status)
										? 'text-destructive'
										: 'text-muted-foreground'}"
								>
									{formatDate(taskItem.dueDate)}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</div>

	<Dialog.Root bind:open={createDialogOpen}>
		<Dialog.Content class="sm:max-w-xl">
			<Dialog.Header>
				<Dialog.Title>New Task</Dialog.Title>
				<Dialog.Description
					>Create tracked operational work from the central queue.</Dialog.Description
				>
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
					createLoading = true;
					return async ({ result, update }) => {
						createLoading = false;
						await update();
						if (result.type === 'success') {
							createDialogOpen = false;
							createPriority = 'medium';
							createAssignee = '';
							createTaskType = 'general';
							createClientId = '';
							toast.success('Task created successfully');
						}
					};
				}}
				class="space-y-4"
			>
				<div class="grid gap-2">
					<Label for="title">Title <span class="text-destructive">*</span></Label>
					<Input id="title" name="title" required placeholder="e.g. Follow up on renewal docs" />
				</div>

				<div class="grid gap-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						placeholder="Add the next action or relevant operational detail..."
						rows={3}
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label>Task Type</Label>
						<Select.Root
							type="single"
							name="taskType"
							value={createTaskType}
							onValueChange={(value) => (createTaskType = value)}
						>
							<Select.Trigger class="w-full">{taskTypeLabel(createTaskType)}</Select.Trigger>
							<Select.Content>
								{#each TASK_TYPES as taskType (taskType)}
									<Select.Item value={taskType}>{taskTypeLabel(taskType)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="grid gap-2">
						<Label for="dueDate">Due Date</Label>
						<Input id="dueDate" name="dueDate" type="date" />
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label>Priority</Label>
						<Select.Root
							type="single"
							name="priority"
							value={createPriority}
							onValueChange={(value) => (createPriority = value)}
						>
							<Select.Trigger class="w-full">
								{createPriority.charAt(0).toUpperCase() + createPriority.slice(1)}
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
						<Label>Assign To</Label>
						<Select.Root
							type="single"
							name="assignedToId"
							value={createAssignee}
							onValueChange={(value) => (createAssignee = value)}
						>
							<Select.Trigger class="w-full">{assigneeLabel(createAssignee)}</Select.Trigger>
							<Select.Content>
								<Select.Item value="unassigned">Unassigned / Triage</Select.Item>
								{#each members as member (member.userId)}
									<Select.Item value={member.userId}>{member.user.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				{#if data.clients.length > 0}
					<div class="grid gap-2">
						<Label>Linked Client</Label>
						<Select.Root
							type="single"
							name="clientId"
							value={createClientId}
							onValueChange={(value) => (createClientId = value)}
						>
							<Select.Trigger class="w-full">{clientLabel(createClientId)}</Select.Trigger>
							<Select.Content>
								{#each data.clients as clientOption (clientOption.id)}
									<Select.Item value={clientOption.id}>{clientOption.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => (createDialogOpen = false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={createLoading}>
						{createLoading ? 'Creating...' : 'Create Task'}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</OrgGuard>
