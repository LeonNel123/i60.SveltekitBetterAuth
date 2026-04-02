<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { APP_NAME } from '$lib/config';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Dashboard — {APP_NAME}</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>

	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">{data.memberCount || '—'}</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{data.memberCount ? 'In your organization' : 'Create an organization first'}
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Pending Invitations</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">{data.pendingInvitations || '—'}</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{data.pendingInvitations
						? `${data.pendingInvitations} awaiting response`
						: 'No pending invitations'}
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Organization</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">{data.organizationName || '—'}</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{data.organizationName ? 'Active organization' : 'Not configured'}
				</p>
			</CardContent>
		</Card>
	</div>
</div>
