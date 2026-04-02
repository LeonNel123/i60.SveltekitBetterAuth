<script lang="ts">
	import { APP_NAME } from '$lib/config';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import TaskStatusBadge from '$lib/components/tasks/task-status-badge.svelte';
	import TaskPriorityBadge from '$lib/components/tasks/task-priority-badge.svelte';
	import Users from '@lucide/svelte/icons/users';
	import Shield from '@lucide/svelte/icons/shield';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import type { PageProps } from './$types';
	import type { TaskStatus, TaskPriority } from '$lib/types';

	let { data }: PageProps = $props();

	function formatDate(d: string | Date | null | undefined): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function isOverdue(dueDate: string | Date | null | undefined, status: string): boolean {
		if (!dueDate || status === 'done') return false;
		return new Date(dueDate) < new Date();
	}
</script>

<svelte:head>
	<title>Command Centre — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<h1 class="text-3xl font-bold tracking-tight">Command Centre</h1>

		<!-- KPI Stats Row -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Clients</CardTitle>
					<Users class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.clients}</p>
					<Button variant="link" class="mt-1 h-auto p-0 text-xs text-muted-foreground" href="/clients">
						View all
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Active Policies</CardTitle>
					<Shield class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.activePolicies}</p>
					<p class="mt-1 text-xs text-muted-foreground">Currently active</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Open Claims</CardTitle>
					<AlertTriangle class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.openClaims}</p>
					<p class="mt-1 text-xs text-muted-foreground">Open or in progress</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
					<ClipboardList class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.pendingTasks}</p>
					<Button variant="link" class="mt-1 h-auto p-0 text-xs text-muted-foreground" href="/tasks">
						View all
					</Button>
				</CardContent>
			</Card>
		</div>

		<!-- Two-column layout: My Tasks + Overdue -->
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- My Tasks -->
			<Card>
				<CardHeader class="flex flex-row items-center justify-between">
					<CardTitle>My Tasks</CardTitle>
					<Button variant="ghost" size="sm" href="/tasks?filter=mine">View all</Button>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if data.myTasks.length === 0}
						<p class="py-4 text-center text-sm text-muted-foreground">No tasks assigned to you.</p>
					{:else}
						{#each data.myTasks as t (t.id)}
							<a
								href="/tasks/{t.id}"
								class="flex items-start justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
							>
								<div class="min-w-0 flex-1 space-y-1">
									<p class="truncate text-sm font-medium">{t.title}</p>
									{#if t.dueDate}
										<p class="text-xs text-muted-foreground">
											Due {formatDate(t.dueDate)}
											{#if isOverdue(t.dueDate, t.status)}
												<span class="text-destructive"> · Overdue</span>
											{/if}
										</p>
									{/if}
								</div>
								<div class="ml-3 shrink-0">
									<TaskPriorityBadge priority={t.priority as TaskPriority} />
								</div>
							</a>
						{/each}
					{/if}
				</CardContent>
			</Card>

			<!-- Overdue Tasks -->
			<Card>
				<CardHeader class="flex flex-row items-center justify-between">
					<CardTitle class="text-destructive">Overdue</CardTitle>
					<Button variant="ghost" size="sm" href="/tasks?filter=overdue">View all</Button>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if data.overdueTasks.length === 0}
						<p class="py-4 text-center text-sm text-muted-foreground">No overdue tasks.</p>
					{:else}
						{#each data.overdueTasks as t (t.id)}
							<a
								href="/tasks/{t.id}"
								class="flex items-start justify-between rounded-md border border-destructive/20 bg-destructive/5 p-3 transition-colors hover:bg-destructive/10"
							>
								<div class="min-w-0 flex-1 space-y-1">
									<p class="truncate text-sm font-medium">{t.title}</p>
									<p class="text-xs text-muted-foreground">
										{#if t.clientName}
											{t.clientName} ·
										{/if}
										Due {formatDate(t.dueDate)}
									</p>
								</div>
								<div class="ml-3 shrink-0">
									<TaskPriorityBadge priority={t.priority as TaskPriority} />
								</div>
							</a>
						{/each}
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Recent Activity -->
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
			</CardHeader>
			<CardContent>
				{#if data.recentTasks.length === 0}
					<p class="py-4 text-center text-sm text-muted-foreground">No recent tasks.</p>
				{:else}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Task</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Priority</TableHead>
								<TableHead>Client</TableHead>
								<TableHead>Created</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each data.recentTasks as t (t.id)}
								<TableRow
									class="cursor-pointer hover:bg-muted/50"
									onclick={() => { window.location.href = `/tasks/${t.id}`; }}
								>
									<TableCell class="font-medium">{t.title}</TableCell>
									<TableCell>
										<TaskStatusBadge status={t.status as TaskStatus} />
									</TableCell>
									<TableCell>
										<TaskPriorityBadge priority={t.priority as TaskPriority} />
									</TableCell>
									<TableCell class="text-muted-foreground">{t.clientName ?? '—'}</TableCell>
									<TableCell class="text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
			</CardContent>
		</Card>
	</div>
</OrgGuard>
