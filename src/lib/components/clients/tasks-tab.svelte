<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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
	import TaskTypeBadge from '$lib/components/tasks/task-type-badge.svelte';
	import { TASK_PRIORITIES, TASK_TYPES } from '$lib/types';
	import { taskTypeLabel } from '$lib/tasks';
	import type { TaskStatus, TaskPriority } from '$lib/types';
	import { formatDate } from '$lib/utils/format';
	import Plus from '@lucide/svelte/icons/plus';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';

	type Task = {
		id: string;
		title: string;
		description: string | null;
		taskType: string;
		status: string;
		priority: string;
		dueDate: Date | string | null;
		assigneeName?: string | null;
		policyNumber?: string | null;
		claimNumber?: string | null;
		[key: string]: unknown;
	};

	type Member = {
		userId: string;
		user: { name: string };
		[key: string]: unknown;
	};

	type Policy = {
		id: string;
		policyNumber: string;
		insurer: string;
	};

	type Claim = {
		id: string;
		claimNumber: string;
	};

	let {
		tasks,
		policies,
		claims,
		members = [],
		form
	}: {
		tasks: Task[];
		policies: Policy[];
		claims: Claim[];
		members?: Member[];
		form: Record<string, unknown> | null;
	} = $props();

	let dialogOpen = $state(false);
	let loading = $state(false);
	let taskPriority = $state('medium');
	let taskType = $state('general');
	let taskAssignee = $state('');
	let linkedPolicyId = $state('');
	let linkedClaimId = $state('');

	function openAdd() {
		taskPriority = 'medium';
		taskType = 'general';
		taskAssignee = '';
		linkedPolicyId = '';
		linkedClaimId = '';
		dialogOpen = true;
	}

	function assigneeLabel(value: string): string {
		if (value === 'unassigned') return 'Unassigned / Triage';
		if (!value) return 'Me (default)';
		return members.find((member) => member.userId === value)?.user?.name ?? 'Select member';
	}

	function policyLabel(value: string): string {
		if (!value) return 'No policy linked';
		return policies.find((policy) => policy.id === value)?.policyNumber ?? 'Select policy';
	}

	function claimLabel(value: string): string {
		if (!value) return 'No claim linked';
		return claims.find((claim) => claim.id === value)?.claimNumber ?? 'Select claim';
	}

	function linkedContext(task: Task) {
		if (task.claimNumber) return `Claim ${task.claimNumber}`;
		if (task.policyNumber) return `Policy ${task.policyNumber}`;
		return 'Client-level';
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
			description="Create a client, policy, or claim-linked task to drive the next action."
		/>
	{:else}
		<div class="overflow-x-auto rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Priority</TableHead>
						<TableHead>Linked</TableHead>
						<TableHead>Assignee</TableHead>
						<TableHead>Due Date</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each tasks as task (task.id)}
						<TableRow
							class="cursor-pointer hover:bg-muted/50"
							onclick={() => goto(resolve(`/tasks/${task.id}`))}
							onkeydown={(event: KeyboardEvent) => {
								if (event.key === 'Enter') goto(resolve(`/tasks/${task.id}`));
							}}
							role="button"
							tabindex={0}
						>
							<TableCell class="font-medium">{task.title}</TableCell>
							<TableCell>
								<TaskTypeBadge taskType={task.taskType} />
							</TableCell>
							<TableCell>
								<TaskStatusBadge status={task.status as TaskStatus} />
							</TableCell>
							<TableCell>
								<TaskPriorityBadge priority={task.priority as TaskPriority} />
							</TableCell>
							<TableCell class="text-muted-foreground">{linkedContext(task)}</TableCell>
							<TableCell class="text-muted-foreground"
								>{task.assigneeName ?? 'Unassigned'}</TableCell
							>
							<TableCell class="text-muted-foreground">{formatDate(task.dueDate)}</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>Add Task</Dialog.Title>
			<Dialog.Description>Create operational work for this client.</Dialog.Description>
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
						taskType = 'general';
						taskAssignee = '';
						linkedPolicyId = '';
						linkedClaimId = '';
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
				<Textarea
					id="taskDescription"
					name="description"
					placeholder="Operational detail, blocker, or next action..."
					rows={3}
				/>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label>Task Type</Label>
					<Select.Root
						type="single"
						name="taskType"
						value={taskType}
						onValueChange={(value) => (taskType = value)}
					>
						<Select.Trigger class="w-full">{taskTypeLabel(taskType)}</Select.Trigger>
						<Select.Content>
							{#each TASK_TYPES as candidate (candidate)}
								<Select.Item value={candidate}>{taskTypeLabel(candidate)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-2">
					<Label>Priority</Label>
					<Select.Root
						type="single"
						name="priority"
						value={taskPriority}
						onValueChange={(value) => (taskPriority = value)}
					>
						<Select.Trigger class="w-full">
							{taskPriority.charAt(0).toUpperCase() + taskPriority.slice(1)}
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
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label>Linked Policy</Label>
					<Select.Root
						type="single"
						name="policyId"
						value={linkedPolicyId}
						onValueChange={(value) => (linkedPolicyId = value)}
					>
						<Select.Trigger class="w-full">{policyLabel(linkedPolicyId)}</Select.Trigger>
						<Select.Content>
							{#each policies as policy (policy.id)}
								<Select.Item value={policy.id}>
									{policy.policyNumber} — {policy.insurer}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-2">
					<Label>Linked Claim</Label>
					<Select.Root
						type="single"
						name="claimId"
						value={linkedClaimId}
						onValueChange={(value) => (linkedClaimId = value)}
					>
						<Select.Trigger class="w-full">{claimLabel(linkedClaimId)}</Select.Trigger>
						<Select.Content>
							{#each claims as claim (claim.id)}
								<Select.Item value={claim.id}>{claim.claimNumber}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="dueDate">Due Date</Label>
					<Input id="dueDate" name="dueDate" type="date" />
				</div>

				{#if members.length > 0}
					<div class="grid gap-2">
						<Label>Assign To</Label>
						<Select.Root
							type="single"
							name="assignedToId"
							value={taskAssignee}
							onValueChange={(value) => (taskAssignee = value)}
						>
							<Select.Trigger class="w-full">{assigneeLabel(taskAssignee)}</Select.Trigger>
							<Select.Content>
								<Select.Item value="unassigned">Unassigned / Triage</Select.Item>
								{#each members as member (member.userId)}
									<Select.Item value={member.userId}>{member.user.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (dialogOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Adding...' : 'Add Task'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
