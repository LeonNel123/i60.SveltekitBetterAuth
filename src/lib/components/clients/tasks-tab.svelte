<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
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
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import TaskStatusBadge from '$lib/components/tasks/task-status-badge.svelte';
	import TaskPriorityBadge from '$lib/components/tasks/task-priority-badge.svelte';
	import { TASK_PRIORITIES } from '$lib/types';
	import type { TaskStatus, TaskPriority } from '$lib/types';
	import { formatDate } from '$lib/utils/format';
	import Plus from '@lucide/svelte/icons/plus';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';

	type Task = {
		id: string;
		title: string;
		description: string | null;
		status: string;
		priority: string;
		dueDate: Date | string | null;
		[key: string]: unknown;
	};

	let {
		tasks,
		clientId,
		form
	}: {
		tasks: Task[];
		clientId: string;
		form: Record<string, unknown> | null;
	} = $props();

	let dialogOpen = $state(false);
	let loading = $state(false);
	let taskPriority = $state('medium');

	function openAdd() {
		taskPriority = 'medium';
		dialogOpen = true;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-end">
		<Button size="sm" onclick={openAdd}>
			<Plus class="mr-2 h-4 w-4" />
			Add Task
		</Button>
	</div>

	{#if tasks.length === 0}
		<EmptyState
			icon={ClipboardList}
			title="No tasks"
			description="Create a task to track work for this client."
		/>
	{:else}
		<div class="overflow-x-auto rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Priority</TableHead>
						<TableHead>Due Date</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each tasks as t (t.id)}
						<TableRow
							class="cursor-pointer hover:bg-muted/50"
							onclick={() => goto(`/tasks/${t.id}`)}
							onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') goto(`/tasks/${t.id}`); }}
							role="button"
							tabindex={0}
						>
							<TableCell class="font-medium">{t.title}</TableCell>
							<TableCell>
								<TaskStatusBadge status={t.status as TaskStatus} />
							</TableCell>
							<TableCell>
								<TaskPriorityBadge priority={t.priority as TaskPriority} />
							</TableCell>
							<TableCell class="text-muted-foreground">
								{formatDate(t.dueDate)}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</div>

<!-- Add Task Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add Task</Dialog.Title>
			<Dialog.Description>Create a new task for this client.</Dialog.Description>
		</Dialog.Header>

		{#if form?.taskError}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{form.taskError}
			</div>
		{/if}

		<form
			method="POST"
			action="?/addTask"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					await update();
					if (result.type === 'success') {
						dialogOpen = false;
						taskPriority = 'medium';
						toast.success('Task created');
					}
				};
			}}
			class="space-y-4"
		>
			<div class="grid gap-2">
				<Label for="taskTitle">Title</Label>
				<Input id="taskTitle" name="title" required placeholder="e.g. Follow up on renewal" />
			</div>

			<div class="grid gap-2">
				<Label for="taskDescription">Description</Label>
				<Textarea id="taskDescription" name="description" placeholder="Optional details..." rows={3} />
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label>Priority</Label>
					<Select.Root type="single" name="priority" value={taskPriority} onValueChange={(v) => (taskPriority = v)}>
						<Select.Trigger class="w-full">
							{taskPriority.charAt(0).toUpperCase() + taskPriority.slice(1)}
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
				<Button variant="outline" type="button" onclick={() => (dialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Adding...' : 'Add Task'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
