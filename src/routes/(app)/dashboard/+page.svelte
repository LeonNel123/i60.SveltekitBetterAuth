<script lang="ts">
	import { resolve } from '$app/paths';
	import { APP_NAME } from '$lib/config';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import TaskPriorityBadge from '$lib/components/tasks/task-priority-badge.svelte';
	import TaskTypeBadge from '$lib/components/tasks/task-type-badge.svelte';
	import Users from '@lucide/svelte/icons/users';
	import Shield from '@lucide/svelte/icons/shield';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Activity from '@lucide/svelte/icons/activity';
	import Layers3 from '@lucide/svelte/icons/layers-3';
	import KanbanSquare from '@lucide/svelte/icons/kanban-square';
	import type { PageProps } from './$types';
	import type { TaskPriority } from '$lib/types';
	import {
		currentGreeting,
		daysUntilDate,
		formatDate,
		isOverdueDate,
		timeAgo
	} from '$lib/utils/format';

	let { data }: PageProps = $props();
	const greeting = currentGreeting();

	const activeBoard = $derived(data.boardStats.find((board) => board.key === data.board) ?? null);
	const triageCount = $derived(data.boardStats.find((board) => board.key === 'triage')?.count ?? 0);
	const attentionCount = $derived(
		data.overdueTasks.length + triageCount + data.stats.urgentRenewals
	);
	const maxWorkload = $derived(
		Math.max(1, ...data.workload.map((entry: { openTasks: number }) => entry.openTasks))
	);

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

	function renewalUrgencyClass(days: number): string {
		if (days <= 7) return 'text-destructive font-semibold';
		if (days <= 14) return 'text-orange-600 dark:text-orange-400 font-medium';
		return 'text-orange-600 dark:text-orange-400';
	}
</script>

<svelte:head>
	<title>Command Centre — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Command Centre</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{greeting}
					{#if attentionCount > 0}
						— <span class="font-medium text-foreground">{attentionCount} operational item(s)</span>
						need attention
					{:else}
						— all clear for now
					{/if}
				</p>
			</div>

			<div class="flex flex-wrap gap-2">
				<Button href={resolve('/tasks')}>
					<KanbanSquare class="mr-2 h-4 w-4" />
					Open Task Boards
				</Button>
				<Button variant="outline" href={resolve('/tasks?board=triage')}>
					<Layers3 class="mr-2 h-4 w-4" />
					Review Triage
				</Button>
			</div>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			<Card class="rounded-xl transition-colors hover:bg-accent/50">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Clients
					</CardTitle>
					<div class="rounded-md bg-primary/10 p-2">
						<Users class="h-4 w-4 text-primary" />
					</div>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.clients}</p>
					<Button
						variant="link"
						class="mt-1 h-auto p-0 text-xs text-muted-foreground"
						href={resolve('/clients')}
					>
						View all
					</Button>
				</CardContent>
			</Card>

			<Card class="rounded-xl transition-colors hover:bg-accent/50">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Active Policies
					</CardTitle>
					<div class="rounded-md bg-green-500/10 p-2">
						<Shield class="h-4 w-4 text-green-600 dark:text-green-400" />
					</div>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.activePolicies}</p>
					<p class="mt-1 text-xs text-muted-foreground">Currently active</p>
				</CardContent>
			</Card>

			<Card class="rounded-xl transition-colors hover:bg-accent/50">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Open Claims
					</CardTitle>
					<div class="rounded-md bg-orange-500/10 p-2">
						<AlertTriangle class="h-4 w-4 text-orange-600 dark:text-orange-400" />
					</div>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.openClaims}</p>
					<p class="mt-1 text-xs text-muted-foreground">Open or in progress</p>
				</CardContent>
			</Card>

			<Card class="rounded-xl transition-colors hover:bg-accent/50">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Open Tasks
					</CardTitle>
					<div class="rounded-md bg-blue-500/10 p-2">
						<ClipboardList class="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.pendingTasks}</p>
					<p class="mt-1 text-xs text-muted-foreground">{triageCount} currently in triage</p>
				</CardContent>
			</Card>
		</div>

		<Card class="rounded-xl">
			<CardHeader class="flex flex-row items-center justify-between">
				<div class="space-y-1">
					<CardTitle class="text-lg font-semibold">Boards</CardTitle>
					<p class="text-sm text-muted-foreground">One task system, many operational views.</p>
				</div>
				<Button variant="ghost" size="sm" href={resolve('/tasks')}>Manage all boards</Button>
			</CardHeader>
			<CardContent>
				<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{#each data.boardStats as board (board.key)}
						<a
							href={resolve(`/dashboard?board=${board.key}`)}
							class="rounded-xl border p-4 transition-colors hover:bg-accent/40 {data.board ===
							board.key
								? 'border-primary bg-primary/5 shadow-sm'
								: 'border-border'}"
						>
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-sm font-semibold">{board.label}</p>
									<p class="mt-1 text-xs text-muted-foreground">{board.description}</p>
								</div>
								<div class="rounded-md bg-muted px-2.5 py-1 text-sm font-semibold">
									{board.count}
								</div>
							</div>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>

		<div class="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
			<Card class="rounded-xl">
				<CardHeader class="flex flex-row items-center justify-between">
					<div>
						<CardTitle class="text-lg font-semibold">
							{activeBoard?.label ?? 'Active Board'}
						</CardTitle>
						<p class="mt-1 text-sm text-muted-foreground">
							{activeBoard?.description}
						</p>
					</div>
					<Button variant="ghost" size="sm" href={resolve(`/tasks?board=${data.board}`)}>
						View board
					</Button>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if data.boardTasks.length === 0}
						<EmptyState
							icon={ClipboardList}
							title="No tasks in this board"
							description="This operational queue is currently clear."
						/>
					{:else}
						{#each data.boardTasks as task (task.id)}
							<a
								href={resolve(`/tasks/${task.id}`)}
								class="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
							>
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium">{task.title}</p>
										<p class="mt-1 text-xs text-muted-foreground">
											{linkedContext(task)}
											{#if task.assigneeName}
												· {task.assigneeName}
											{:else}
												· Unassigned
											{/if}
											{#if task.dueDate}
												· Due {formatDate(task.dueDate)}
												{#if isOverdueDate(task.dueDate, task.status)}
													<span class="font-medium text-destructive"> · Overdue</span>
												{/if}
											{/if}
										</p>
									</div>
									<div class="flex flex-wrap items-center gap-2">
										<TaskTypeBadge taskType={task.taskType} />
										<TaskPriorityBadge priority={task.priority as TaskPriority} />
									</div>
								</div>
							</a>
						{/each}
					{/if}
				</CardContent>
			</Card>

			<Card class="rounded-xl">
				<CardHeader class="flex flex-row items-center justify-between">
					<CardTitle class="text-lg font-semibold text-destructive">Overdue</CardTitle>
					<Button variant="ghost" size="sm" href={resolve('/tasks?filter=overdue')}>
						View all
					</Button>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if data.overdueTasks.length === 0}
						<EmptyState
							icon={AlertTriangle}
							title="No overdue tasks"
							description="Nothing is currently past due."
						/>
					{:else}
						{#each data.overdueTasks as task (task.id)}
							<a
								href={resolve(`/tasks/${task.id}`)}
								class="flex items-start justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10"
							>
								<div class="min-w-0 flex-1 space-y-1">
									<p class="truncate text-sm font-medium">{task.title}</p>
									<p class="text-xs text-muted-foreground">
										{linkedContext(task)} · Due {formatDate(task.dueDate)}
									</p>
								</div>
								<div class="ml-3 shrink-0">
									<TaskPriorityBadge priority={task.priority as TaskPriority} />
								</div>
							</a>
						{/each}
					{/if}
				</CardContent>
			</Card>
		</div>

		<div class="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
			<Card class="rounded-xl">
				<CardHeader class="flex flex-row items-center justify-between">
					<div class="flex items-center gap-2">
						<CalendarClock class="h-5 w-5 text-muted-foreground" />
						<CardTitle class="text-lg font-semibold">Renewing Soon</CardTitle>
						{#if data.stats.urgentRenewals > 0}
							<span
								class="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive"
							>
								{data.stats.urgentRenewals} within 7 days
							</span>
						{/if}
					</div>
				</CardHeader>
				<CardContent>
					{#if data.renewingSoon.length === 0}
						<EmptyState
							icon={CalendarClock}
							title="No renewals soon"
							description="No policies renew in the next 30 days."
						/>
					{:else}
						<div class="space-y-2">
							{#each data.renewingSoon as policy (policy.id)}
								{@const days = daysUntilDate(policy.endDate)}
								<a
									href={resolve(`/clients/${policy.clientId}`)}
									class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
								>
									<div class="min-w-0 flex-1 space-y-0.5">
										<p class="truncate text-sm font-medium">{policy.policyNumber ?? '—'}</p>
										<p class="text-xs text-muted-foreground">
											{policy.insurer ?? '—'} · {policy.clientName}
										</p>
									</div>
									<div class="ml-3 shrink-0 text-right">
										<p class="text-xs text-muted-foreground">{formatDate(policy.endDate)}</p>
										<p class="text-xs {renewalUrgencyClass(days)}">
											{days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`}
										</p>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<Card class="rounded-xl">
				<CardHeader>
					<CardTitle class="text-lg font-semibold">Workload Distribution</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					{#if data.workload.length === 0}
						<EmptyState
							icon={Layers3}
							title="No active workload"
							description="Open work will appear here once tasks are in flight."
						/>
					{:else}
						{#each data.workload as entry (entry.assignedToId ?? entry.assigneeName)}
							<div class="space-y-1">
								<div class="flex items-center justify-between gap-3 text-sm">
									<span class="font-medium">{entry.assigneeName}</span>
									<span class="text-muted-foreground">{entry.openTasks} open</span>
								</div>
								<div class="h-2 rounded-full bg-muted">
									<div
										class="h-2 rounded-full bg-primary"
										style={`width: ${(entry.openTasks / maxWorkload) * 100}%`}
									></div>
								</div>
							</div>
						{/each}
					{/if}
				</CardContent>
			</Card>
		</div>

		<Card class="rounded-xl">
			<CardHeader class="flex flex-row items-center justify-between">
				<div class="flex items-center gap-2">
					<Activity class="h-5 w-5 text-muted-foreground" />
					<CardTitle class="text-lg font-semibold">Recent Activity</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				{#if data.recentActivity.length === 0}
					<EmptyState
						icon={Activity}
						title="No activity yet"
						description="Actions taken in your organisation will appear here."
					/>
				{:else}
					<div class="space-y-2">
						{#each data.recentActivity as entry (entry.id)}
							{#if entry.clientId}
								<a
									href={resolve(`/clients/${entry.clientId}`)}
									class="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
								>
									<div class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40"></div>
									<div class="min-w-0 flex-1">
										<p class="text-sm">{entry.description}</p>
										<p class="mt-1 text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</p>
									</div>
									<Badge variant="outline" class="shrink-0 text-xs capitalize">
										{entry.entityType}
									</Badge>
								</a>
							{:else}
								<div class="flex items-start gap-3 rounded-lg border p-4">
									<div class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40"></div>
									<div class="min-w-0 flex-1">
										<p class="text-sm">{entry.description}</p>
										<p class="mt-1 text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</p>
									</div>
									<Badge variant="outline" class="shrink-0 text-xs capitalize">
										{entry.entityType}
									</Badge>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</OrgGuard>
