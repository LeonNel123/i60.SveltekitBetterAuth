<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { APP_NAME } from '$lib/config';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import PoliciesTab from '$lib/components/clients/policies-tab.svelte';
	import ClaimsTab from '$lib/components/clients/claims-tab.svelte';
	import TasksTab from '$lib/components/clients/tasks-tab.svelte';
	import DocumentsTab from '$lib/components/clients/documents-tab.svelte';
	import NotesTab from '$lib/components/clients/notes-tab.svelte';
	import ActivityTab from '$lib/components/clients/activity-tab.svelte';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import FileText from '@lucide/svelte/icons/file-text';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Active tab
	let activeTab = $state('policies');

	// Delete client state
	let deleteClientOpen = $state(false);
	let deleteClientLoading = $state(false);

	// Stats
	let openTaskCount = $derived(
		data.tasks.filter((t) => t.status !== 'done').length
	);
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
				<Button variant="destructive" onclick={() => (deleteClientOpen = true)}>
					<Trash2 class="mr-2 h-4 w-4" />
					Delete
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

			<Tabs.Content value="policies" class="mt-4">
				<PoliciesTab
					policies={data.policies}
					clientId={data.client.id}
					{form}
				/>
			</Tabs.Content>

			<Tabs.Content value="claims" class="mt-4">
				<ClaimsTab
					claims={data.claims}
					policies={data.policies}
					clientId={data.client.id}
					{form}
				/>
			</Tabs.Content>

			<Tabs.Content value="tasks" class="mt-4">
				<TasksTab
					tasks={data.tasks}
					clientId={data.client.id}
					{form}
				/>
			</Tabs.Content>

			<Tabs.Content value="documents" class="mt-4">
				<DocumentsTab
					documents={data.documents}
					tags={data.tags}
					clientId={data.client.id}
					{form}
				/>
			</Tabs.Content>

			<Tabs.Content value="notes" class="mt-4">
				<NotesTab
					notes={data.notes}
					clientId={data.client.id}
					{form}
				/>
			</Tabs.Content>

			<Tabs.Content value="activity" class="mt-4">
				<ActivityTab activities={data.activities} />
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<!-- Delete Client Confirmation -->
	<AlertDialog.Root bind:open={deleteClientOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete Client</AlertDialog.Title>
				<AlertDialog.Description>
					Are you sure you want to delete "{data.client.name}"? All associated policies, claims, tasks, documents, and notes will be permanently removed. This action cannot be undone.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<form
					method="POST"
					action="?/deleteClient"
					use:enhance={() => {
						deleteClientLoading = true;
						return async ({ result, update }) => {
							deleteClientLoading = false;
							if (result.type === 'redirect') {
								toast.success('Client deleted');
							}
							await update();
						};
					}}
				>
					<input type="hidden" name="confirm" value="yes" />
					<AlertDialog.Action type="submit" variant="destructive" disabled={deleteClientLoading}>
						{deleteClientLoading ? 'Deleting...' : 'Delete Client'}
					</AlertDialog.Action>
				</form>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</OrgGuard>
