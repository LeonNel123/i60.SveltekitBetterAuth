<script lang="ts">
	import { goto } from '$app/navigation';
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
	import { Badge } from '$lib/components/ui/badge';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import TaskStatusBadge from '$lib/components/tasks/task-status-badge.svelte';
	import TaskPriorityBadge from '$lib/components/tasks/task-priority-badge.svelte';
	import Users from '@lucide/svelte/icons/users';
	import Shield from '@lucide/svelte/icons/shield';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Activity from '@lucide/svelte/icons/activity';
	import type { PageProps } from './$types';
	import type { TaskStatus, TaskPriority } from '$lib/types';
	import { formatDate, timeAgo } from '$lib/utils/format';

	let { data }: PageProps = $props();

	function isOverdue(dueDate: string | Date | null | undefined, status: string): boolean {
		if (!dueDate || status === 'done') return false;
		return new Date(dueDate) < new Date();
	}

	const greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	});

	const attentionCount = $derived(data.stats.pendingTasks + data.overdueTasks.length);

	function daysUntil(endDate: string | Date | null | undefined): number {
		if (!endDate) return Infinity;
		const end = new Date(endDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		end.setHours(0, 0, 0, 0);
		return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	}

	function renewalUrgencyClass(days: number): string {
		if (days <= 7) return 'text-destructive font-semibold';
		if (days <= 14) return 'text-orange-600 dark:text-orange-400 font-medium';
		return 'text-yellow-600 dark:text-yellow-400';
	}

	function renewalRowClass(days: number): string {
		if (days <= 7) return 'border-destructive/20 bg-destructive/5 hover:bg-destructive/10';
		if (days <= 14) return 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10';
		return 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10';
	}
</script>

<svelte:head>
	<title>Command Centre — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<!-- Contextual greeting header -->
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Command Centre</h1>
			<p class="mt-1 text-muted-foreground">
				{greeting}{#if attentionCount > 0} — <span class="font-medium text-foreground">{attentionCount} task{attentionCount !== 1 ? 's' : ''}</span> need{attentionCount === 1 ? 's' : ''} attention{:else} — all clear for now{/if}
			</p>
		</div>

		<!-- KPI Stats Row -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card class="transition-colors hover:bg-accent/50">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Clients</CardTitle>
					<div class="rounded-md bg-primary/10 p-2">
						<Users class="h-4 w-4 text-primary" />
					</div>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.clients}</p>
					<Button variant="link" class="mt-1 h-auto p-0 text-xs text-muted-foreground" href="/clients">
						View all
					</Button>
				</CardContent>
			</Card>

			<Card class="transition-colors hover:bg-accent/50">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Active Policies</CardTitle>
					<div class="rounded-md bg-green-500/10 p-2">
						<Shield class="h-4 w-4 text-green-600 dark:text-green-400" />
					</div>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.activePolicies}</p>
					<p class="mt-1 text-xs text-muted-foreground">Currently active</p>
				</CardContent>
			</Card>

			<Card class="transition-colors hover:bg-accent/50">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Open Claims</CardTitle>
					<div class="rounded-md bg-orange-500/10 p-2">
						<AlertTriangle class="h-4 w-4 text-orange-600 dark:text-orange-400" />
					</div>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{data.stats.openClaims}</p>
					<p class="mt-1 text-xs text-muted-foreground">Open or in progress</p>
				</CardContent>
			</Card>

			<Card class="transition-colors hover:bg-accent/50">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
					<div class="rounded-md bg-blue-500/10 p-2">
						<ClipboardList class="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
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
					<CardTitle class="text-base">My Tasks</CardTitle>
					<Button variant="ghost" size="sm" href="/tasks?filter=mine">View all</Button>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if data.myTasks.length === 0}
						<div class="flex flex-col items-center justify-center py-8 text-center">
							<ClipboardList class="mb-2 h-8 w-8 text-muted-foreground/40" />
							<p class="text-sm text-muted-foreground">No tasks assigned to you.</p>
						</div>
					{:else}
						{#each data.myTasks as t (t.id)}
							<a
								href="/tasks/{t.id}"
								class="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
							>
								<div class="min-w-0 flex-1 space-y-1">
									<p class="truncate text-sm font-medium">{t.title}</p>
									{#if t.dueDate}
										<p class="text-xs text-muted-foreground">
											Due {formatDate(t.dueDate)}
											{#if isOverdue(t.dueDate, t.status)}
												<span class="font-medium text-destructive"> · Overdue</span>
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
					<CardTitle class="text-base text-destructive">Overdue</CardTitle>
					<Button variant="ghost" size="sm" href="/tasks?filter=overdue">View all</Button>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if data.overdueTasks.length === 0}
						<div class="flex flex-col items-center justify-center py-8 text-center">
							<CheckCircle class="mb-2 h-8 w-8 text-green-500/60" />
							<p class="text-sm text-muted-foreground">No overdue tasks. You're all caught up!</p>
						</div>
					{:else}
						{#each data.overdueTasks as t (t.id)}
							<a
								href="/tasks/{t.id}"
								class="flex items-start justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3 transition-colors hover:bg-destructive/10"
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

		<!-- Renewing Soon -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between">
				<div class="flex items-center gap-2">
					<CalendarClock class="h-5 w-5 text-muted-foreground" />
					<CardTitle class="text-base">Renewing Soon</CardTitle>
					{#if data.stats.urgentRenewals > 0}
						<span class="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
							{data.stats.urgentRenewals} within 7 days
						</span>
					{/if}
				</div>
			</CardHeader>
			<CardContent>
				{#if data.renewingSoon.length === 0}
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<CalendarClock class="mb-2 h-8 w-8 text-muted-foreground/40" />
						<p class="text-sm text-muted-foreground">No policies renewing in the next 30 days.</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each data.renewingSoon as p (p.id)}
							{@const days = daysUntil(p.endDate)}
							<a
								href="/clients/{p.clientId}"
								class="flex items-center justify-between rounded-lg border p-3 transition-colors {renewalRowClass(days)}"
							>
								<div class="min-w-0 flex-1 space-y-0.5">
									<p class="truncate text-sm font-medium">{p.policyNumber ?? '—'}</p>
									<p class="text-xs text-muted-foreground">
										{p.insurer ?? '—'} · {p.clientName}
									</p>
								</div>
								<div class="ml-3 shrink-0 text-right">
									<p class="text-xs text-muted-foreground">{formatDate(p.endDate)}</p>
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

		<!-- Recent Activity -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between">
				<div class="flex items-center gap-2">
					<Activity class="h-5 w-5 text-muted-foreground" />
					<CardTitle class="text-base">Recent Activity</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				{#if data.recentActivity.length === 0}
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<Activity class="mb-2 h-8 w-8 text-muted-foreground/40" />
						<p class="text-sm text-muted-foreground">No activity yet.</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each data.recentActivity as a (a.id)}
							{#if a.clientId}
								<a
									href="/clients/{a.clientId}"
									class="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
								>
									<div class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40"></div>
									<div class="flex-1 min-w-0">
										<p class="text-sm">{a.description}</p>
										<p class="mt-1 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
									</div>
									<Badge variant="outline" class="shrink-0 text-xs capitalize">
										{a.entityType}
									</Badge>
								</a>
							{:else}
								<div class="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
									<div class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40"></div>
									<div class="flex-1 min-w-0">
										<p class="text-sm">{a.description}</p>
										<p class="mt-1 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
									</div>
									<Badge variant="outline" class="shrink-0 text-xs capitalize">
										{a.entityType}
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
