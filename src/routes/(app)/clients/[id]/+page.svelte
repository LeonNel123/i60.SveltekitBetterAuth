<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { APP_NAME } from '$lib/config';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
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
	import * as Tabs from '$lib/components/ui/tabs';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import EmptyState from '$lib/components/shared/empty-state.svelte';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import TaskStatusBadge from '$lib/components/tasks/task-status-badge.svelte';
	import TaskPriorityBadge from '$lib/components/tasks/task-priority-badge.svelte';
	import { POLICY_TYPES, POLICY_STATUSES, CLAIM_STATUSES, TASK_PRIORITIES } from '$lib/types';
	import type { TaskStatus, TaskPriority, ClaimStatus } from '$lib/types';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Upload from '@lucide/svelte/icons/upload';
	import Download from '@lucide/svelte/icons/download';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import FileText from '@lucide/svelte/icons/file-text';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Dialog states
	let policyDialogOpen = $state(false);
	let claimDialogOpen = $state(false);
	let taskDialogOpen = $state(false);
	let docDialogOpen = $state(false);

	// Select states for form submission
	let policyType = $state('other');
	let policyStatus = $state('active');
	let claimPolicyId = $state('');
	let claimStatus = $state('open');
	let taskPriority = $state('medium');

	// Active tab
	let activeTab = $state('policies');

	// Stats
	let openTaskCount = $derived(
		data.tasks.filter((t) => t.status !== 'done').length
	);

	// Helpers
	function formatDate(d: string | Date | null | undefined): string {
		if (!d) return '—';
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function formatCurrency(v: string | number | null | undefined): string {
		if (v == null || v === '') return '—';
		const num = typeof v === 'string' ? parseFloat(v) : v;
		if (isNaN(num)) return '—';
		return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(num);
	}

	function timeAgo(d: string | Date | null | undefined): string {
		if (!d) return '';
		const date = typeof d === 'string' ? new Date(d) : d;
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		return formatDate(d);
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1048576).toFixed(1)} MB`;
	}

	function policyTypeLabel(t: string): string {
		const labels: Record<string, string> = {
			motor: 'Motor',
			property: 'Property',
			liability: 'Liability',
			commercial: 'Commercial',
			life: 'Life',
			other: 'Other'
		};
		return labels[t] ?? t;
	}

	function claimStatusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
			open: 'default',
			in_progress: 'default',
			settled: 'secondary',
			rejected: 'destructive',
			closed: 'outline'
		};
		return map[s] ?? 'outline';
	}

	function claimStatusLabel(s: string): string {
		const labels: Record<string, string> = {
			open: 'Open',
			in_progress: 'In Progress',
			settled: 'Settled',
			rejected: 'Rejected',
			closed: 'Closed'
		};
		return labels[s] ?? s;
	}

	function policyStatusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
			active: 'default',
			pending: 'outline',
			lapsed: 'destructive',
			cancelled: 'secondary'
		};
		return map[s] ?? 'outline';
	}

	function policyStatusLabel(s: string): string {
		const labels: Record<string, string> = {
			active: 'Active',
			pending: 'Pending',
			lapsed: 'Lapsed',
			cancelled: 'Cancelled'
		};
		return labels[s] ?? s;
	}

	function entityTypeBadgeVariant(t: string): 'default' | 'secondary' | 'outline' {
		const map: Record<string, 'default' | 'secondary' | 'outline'> = {
			client: 'default',
			policy: 'secondary',
			claim: 'destructive' as any,
			task: 'outline',
			document: 'secondary',
			note: 'outline'
		};
		return map[t] ?? 'outline';
	}
</script>

<svelte:head>
	<title>{data.client.name} — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<!-- Header -->
		<PageHeader
			title={data.client.name}
			description={data.client.type === 'individual' ? 'Individual Client' : 'Company Client'}
		>
			{#snippet actions()}
				<Button variant="outline" href="/clients/{data.client.id}/edit">
					<Pencil class="mr-2 h-4 w-4" />
					Edit
				</Button>
			{/snippet}
		</PageHeader>

		<!-- Client Info Summary -->
		<Card>
			<CardContent class="pt-6">
				<div class="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
					{#if data.client.email}
						<div class="flex items-center gap-2.5 text-sm">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
								<Mail class="h-4 w-4 text-muted-foreground" />
							</div>
							<div class="min-w-0">
								<p class="text-xs text-muted-foreground">Email</p>
								<p class="truncate">{data.client.email}</p>
							</div>
						</div>
					{/if}
					{#if data.client.phone}
						<div class="flex items-center gap-2.5 text-sm">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
								<Phone class="h-4 w-4 text-muted-foreground" />
							</div>
							<div class="min-w-0">
								<p class="text-xs text-muted-foreground">Phone</p>
								<p class="truncate">{data.client.phone}</p>
							</div>
						</div>
					{/if}
					{#if data.client.address}
						<div class="flex items-center gap-2.5 text-sm">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
								<MapPin class="h-4 w-4 text-muted-foreground" />
							</div>
							<div class="min-w-0">
								<p class="text-xs text-muted-foreground">Address</p>
								<p class="truncate">{data.client.address}</p>
							</div>
						</div>
					{/if}
					{#if data.client.idNumber}
						<div class="flex items-center gap-2.5 text-sm">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
								<FileText class="h-4 w-4 text-muted-foreground" />
							</div>
							<div class="min-w-0">
								<p class="text-xs text-muted-foreground">ID Number</p>
								<p class="truncate">{data.client.idNumber}</p>
							</div>
						</div>
					{/if}
					{#if data.client.registrationNumber}
						<div class="flex items-center gap-2.5 text-sm">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
								<FileText class="h-4 w-4 text-muted-foreground" />
							</div>
							<div class="min-w-0">
								<p class="text-xs text-muted-foreground">Reg Number</p>
								<p class="truncate">{data.client.registrationNumber}</p>
							</div>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Quick Stats -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardContent class="flex items-center gap-3 pt-6">
					<div class="rounded-lg bg-primary/10 p-2.5">
						<ShieldCheck class="h-5 w-5 text-primary" />
					</div>
					<div>
						<p class="text-2xl font-bold">{data.policies.length}</p>
						<p class="text-xs text-muted-foreground">Policies</p>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex items-center gap-3 pt-6">
					<div class="rounded-lg bg-orange-500/10 p-2.5">
						<AlertTriangle class="h-5 w-5 text-orange-600 dark:text-orange-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{data.claims.length}</p>
						<p class="text-xs text-muted-foreground">Claims</p>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex items-center gap-3 pt-6">
					<div class="rounded-lg bg-blue-500/10 p-2.5">
						<ClipboardList class="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{openTaskCount}</p>
						<p class="text-xs text-muted-foreground">Open Tasks</p>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex items-center gap-3 pt-6">
					<div class="rounded-lg bg-green-500/10 p-2.5">
						<FileText class="h-5 w-5 text-green-600 dark:text-green-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{data.documents.length}</p>
						<p class="text-xs text-muted-foreground">Documents</p>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Tabbed Content -->
		<Tabs.Root bind:value={activeTab}>
			<Tabs.List>
				<Tabs.Trigger value="policies">Policies</Tabs.Trigger>
				<Tabs.Trigger value="claims">Claims</Tabs.Trigger>
				<Tabs.Trigger value="tasks">Tasks</Tabs.Trigger>
				<Tabs.Trigger value="documents">Documents</Tabs.Trigger>
				<Tabs.Trigger value="notes">Notes</Tabs.Trigger>
				<Tabs.Trigger value="activity">Activity</Tabs.Trigger>
			</Tabs.List>

			<!-- Policies Tab -->
			<Tabs.Content value="policies" class="mt-4">
				<div class="space-y-4">
					<div class="flex justify-end">
						<Button size="sm" onclick={() => (policyDialogOpen = true)}>
							<Plus class="mr-2 h-4 w-4" />
							Add Policy
						</Button>
					</div>

					{#if data.policies.length === 0}
						<EmptyState
							icon={ShieldCheck}
							title="No policies"
							description="Add a policy to start tracking coverage."
						/>
					{:else}
						<div class="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Policy Number</TableHead>
										<TableHead>Insurer</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Start</TableHead>
										<TableHead>End</TableHead>
										<TableHead class="text-right">Premium</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each data.policies as p (p.id)}
										<TableRow class="hover:bg-muted/50">
											<TableCell class="font-medium">{p.policyNumber}</TableCell>
											<TableCell>{p.insurer}</TableCell>
											<TableCell>
												<Badge variant="outline">{policyTypeLabel(p.type)}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant={policyStatusVariant(p.status)}>
													{policyStatusLabel(p.status)}
												</Badge>
											</TableCell>
											<TableCell class="text-muted-foreground">
												{formatDate(p.startDate)}
											</TableCell>
											<TableCell class="text-muted-foreground">
												{formatDate(p.endDate)}
											</TableCell>
											<TableCell class="text-right">
												{formatCurrency(p.premium)}
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<!-- Claims Tab -->
			<Tabs.Content value="claims" class="mt-4">
				<div class="space-y-4">
					<div class="flex justify-end">
						<Button size="sm" onclick={() => (claimDialogOpen = true)}>
							<Plus class="mr-2 h-4 w-4" />
							Add Claim
						</Button>
					</div>

					{#if data.claims.length === 0}
						<EmptyState
							icon={AlertTriangle}
							title="No claims"
							description="No claims have been filed for this client."
						/>
					{:else}
						<div class="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Claim Number</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date of Loss</TableHead>
										<TableHead>Description</TableHead>
										<TableHead class="text-right">Claimed</TableHead>
										<TableHead class="text-right">Settled</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each data.claims as c (c.id)}
										<TableRow class="hover:bg-muted/50">
											<TableCell class="font-medium">{c.claimNumber}</TableCell>
											<TableCell>
												<Badge variant={claimStatusVariant(c.status)}>
													{claimStatusLabel(c.status)}
												</Badge>
											</TableCell>
											<TableCell class="text-muted-foreground">
												{formatDate(c.dateOfLoss)}
											</TableCell>
											<TableCell class="max-w-[200px] truncate text-muted-foreground">
												{c.description || '—'}
											</TableCell>
											<TableCell class="text-right">
												{formatCurrency(c.amountClaimed)}
											</TableCell>
											<TableCell class="text-right">
												{formatCurrency(c.amountSettled)}
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<!-- Tasks Tab -->
			<Tabs.Content value="tasks" class="mt-4">
				<div class="space-y-4">
					<div class="flex justify-end">
						<Button size="sm" onclick={() => (taskDialogOpen = true)}>
							<Plus class="mr-2 h-4 w-4" />
							Add Task
						</Button>
					</div>

					{#if data.tasks.length === 0}
						<EmptyState
							icon={ClipboardList}
							title="No tasks"
							description="Create a task to track work for this client."
						/>
					{:else}
						<div class="rounded-md border">
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
									{#each data.tasks as t (t.id)}
										<TableRow
											class="cursor-pointer hover:bg-muted/50"
											onclick={() => goto(`/tasks/${t.id}`)}
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
			</Tabs.Content>

			<!-- Documents Tab -->
			<Tabs.Content value="documents" class="mt-4">
				<div class="space-y-4">
					<div class="flex justify-end">
						<Button size="sm" onclick={() => (docDialogOpen = true)}>
							<Upload class="mr-2 h-4 w-4" />
							Upload Document
						</Button>
					</div>

					{#if data.documents.length === 0}
						<EmptyState
							icon={FileText}
							title="No documents"
							description="Upload documents for this client."
						/>
					{:else}
						<div class="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Size</TableHead>
										<TableHead>Uploaded</TableHead>
										<TableHead class="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each data.documents as d (d.id)}
										<TableRow class="hover:bg-muted/50">
											<TableCell class="font-medium">{d.name}</TableCell>
											<TableCell class="text-muted-foreground">
												{d.mimeType.split('/').pop()}
											</TableCell>
											<TableCell class="text-muted-foreground">
												{formatFileSize(d.size)}
											</TableCell>
											<TableCell class="text-muted-foreground">
												{formatDate(d.createdAt)}
											</TableCell>
											<TableCell class="text-right">
												<Button
													variant="ghost"
													size="sm"
													href="/api/documents/{d.id}/download"
												>
													<Download class="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<!-- Notes Tab -->
			<Tabs.Content value="notes" class="mt-4">
				<div class="space-y-4">
					<!-- Add Note Form -->
					<Card>
						<CardContent class="pt-6">
							{#if form?.noteError}
								<div class="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									{form.noteError}
								</div>
							{/if}
							<form
								method="POST"
								action="?/addNote"
								use:enhance={() => {
									return async ({ result, update }) => {
										await update();
									};
								}}
								class="space-y-3"
							>
								<Textarea
									name="content"
									placeholder="Write a note..."
									rows={3}
									required
								/>
								<div class="flex justify-end">
									<Button type="submit" size="sm">Add Note</Button>
								</div>
							</form>
						</CardContent>
					</Card>

					{#if data.notes.length === 0}
						<p class="py-8 text-center text-sm text-muted-foreground">No notes yet. Add one above to get started.</p>
					{:else}
						<div class="space-y-2">
							{#each data.notes as n (n.id)}
								<Card>
									<CardContent class="py-4">
										<p class="whitespace-pre-wrap text-sm leading-relaxed">{n.content}</p>
										<p class="mt-2 text-xs text-muted-foreground">
											{timeAgo(n.createdAt)}
										</p>
									</CardContent>
								</Card>
							{/each}
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<!-- Activity Tab -->
			<Tabs.Content value="activity" class="mt-4">
				{#if data.activities.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
				{:else}
					<div class="space-y-2">
						{#each data.activities as a (a.id)}
							<div
								class="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
							>
								<div class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40"></div>
								<div class="flex-1">
									<p class="text-sm">{a.description}</p>
									<p class="mt-1 text-xs text-muted-foreground">
										{timeAgo(a.createdAt)}
									</p>
								</div>
								<Badge variant="outline" class="shrink-0 text-xs capitalize">
									{a.entityType}
								</Badge>
							</div>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<!-- Add Policy Dialog -->
	<Dialog.Root bind:open={policyDialogOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Add Policy</Dialog.Title>
				<Dialog.Description>Add a new insurance policy for this client.</Dialog.Description>
			</Dialog.Header>

			{#if form?.policyError}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.policyError}
				</div>
			{/if}

			<form
				method="POST"
				action="?/addPolicy"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') policyDialogOpen = false;
					};
				}}
				class="space-y-4"
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="policyNumber">Policy Number</Label>
						<Input id="policyNumber" name="policyNumber" required placeholder="e.g. POL-001" />
					</div>
					<div class="grid gap-2">
						<Label for="insurer">Insurer</Label>
						<Input id="insurer" name="insurer" required placeholder="e.g. Santam" />
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label>Type</Label>
						<Select.Root type="single" name="type" value={policyType} onValueChange={(v) => (policyType = v)}>
							<Select.Trigger class="w-full">
								{policyTypeLabel(policyType)}
							</Select.Trigger>
							<Select.Content>
								{#each POLICY_TYPES as t}
									<Select.Item value={t}>{policyTypeLabel(t)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="grid gap-2">
						<Label>Status</Label>
						<Select.Root type="single" name="status" value={policyStatus} onValueChange={(v) => (policyStatus = v)}>
							<Select.Trigger class="w-full">
								{policyStatusLabel(policyStatus)}
							</Select.Trigger>
							<Select.Content>
								{#each POLICY_STATUSES as s}
									<Select.Item value={s}>{policyStatusLabel(s)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="startDate">Start Date</Label>
						<Input id="startDate" name="startDate" type="date" />
					</div>
					<div class="grid gap-2">
						<Label for="endDate">End Date</Label>
						<Input id="endDate" name="endDate" type="date" />
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="premium">Monthly Premium (ZAR)</Label>
					<Input id="premium" name="premium" type="number" step="0.01" placeholder="0.00" />
				</div>

				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => (policyDialogOpen = false)}>
						Cancel
					</Button>
					<Button type="submit">Add Policy</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Add Claim Dialog -->
	<Dialog.Root bind:open={claimDialogOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Add Claim</Dialog.Title>
				<Dialog.Description>File a new claim for this client.</Dialog.Description>
			</Dialog.Header>

			{#if form?.claimError}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.claimError}
				</div>
			{/if}

			<form
				method="POST"
				action="?/addClaim"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') claimDialogOpen = false;
					};
				}}
				class="space-y-4"
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="claimNumber">Claim Number</Label>
						<Input id="claimNumber" name="claimNumber" required placeholder="e.g. CLM-001" />
					</div>
					<div class="grid gap-2">
						<Label>Linked Policy</Label>
						<Select.Root type="single" name="policyId" value={claimPolicyId} onValueChange={(v) => (claimPolicyId = v)}>
							<Select.Trigger class="w-full">
								{#if claimPolicyId}
									{data.policies.find((p) => p.id === claimPolicyId)?.policyNumber ?? 'Select policy'}
								{:else}
									None
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each data.policies as p (p.id)}
									<Select.Item value={p.id}>
										{p.policyNumber} — {p.insurer}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label>Status</Label>
						<Select.Root type="single" name="status" value={claimStatus} onValueChange={(v) => (claimStatus = v)}>
							<Select.Trigger class="w-full">
								{claimStatusLabel(claimStatus)}
							</Select.Trigger>
							<Select.Content>
								{#each CLAIM_STATUSES as s}
									<Select.Item value={s}>{claimStatusLabel(s)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="grid gap-2">
						<Label for="dateOfLoss">Date of Loss</Label>
						<Input id="dateOfLoss" name="dateOfLoss" type="date" />
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="claimDescription">Description</Label>
					<Textarea id="claimDescription" name="description" placeholder="Describe the loss..." rows={3} />
				</div>

				<div class="grid gap-2">
					<Label for="amountClaimed">Amount Claimed (ZAR)</Label>
					<Input id="amountClaimed" name="amountClaimed" type="number" step="0.01" placeholder="0.00" />
				</div>

				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => (claimDialogOpen = false)}>
						Cancel
					</Button>
					<Button type="submit">Add Claim</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Add Task Dialog -->
	<Dialog.Root bind:open={taskDialogOpen}>
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
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') taskDialogOpen = false;
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
					<Button variant="outline" type="button" onclick={() => (taskDialogOpen = false)}>
						Cancel
					</Button>
					<Button type="submit">Add Task</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Upload Document Dialog -->
	<Dialog.Root bind:open={docDialogOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Upload Document</Dialog.Title>
				<Dialog.Description>Upload a file for this client.</Dialog.Description>
			</Dialog.Header>

			{#if form?.docError}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.docError}
				</div>
			{/if}

			<form
				method="POST"
				action="?/uploadDocument"
				enctype="multipart/form-data"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') docDialogOpen = false;
					};
				}}
				class="space-y-4"
			>
				<div class="grid gap-2">
					<Label for="file">File</Label>
					<Input id="file" name="file" type="file" required />
				</div>

				<div class="grid gap-2">
					<Label for="docName">Document Name</Label>
					<Input id="docName" name="name" placeholder="Optional — defaults to file name" />
				</div>

				{#if data.tags.length > 0}
					<div class="grid gap-2">
						<Label>Tags</Label>
						<div class="flex flex-wrap gap-3">
							{#each data.tags as t (t.id)}
								<label class="flex items-center gap-2 text-sm">
									<input type="checkbox" name="tagIds" value={t.id} class="accent-primary" />
									{t.name}
								</label>
							{/each}
						</div>
					</div>
				{/if}

				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => (docDialogOpen = false)}>
						Cancel
					</Button>
					<Button type="submit">Upload</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</OrgGuard>
