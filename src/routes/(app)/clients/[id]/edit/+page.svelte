<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { APP_NAME } from '$lib/config';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import ClientForm from '$lib/components/clients/client-form.svelte';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let deleteOpen = $state(false);
	let deleteLoading = $state(false);
</script>

<svelte:head>
	<title>Edit {data.client.name} — {APP_NAME}</title>
</svelte:head>

<div class="space-y-6">
	<PageHeader title="Edit Client" description="Update {data.client.name}'s details." />
	<Card class="max-w-2xl">
		<CardHeader>
			<CardTitle>Client Details</CardTitle>
			<CardDescription>Modify the fields below and save.</CardDescription>
		</CardHeader>
		<CardContent>
			<ClientForm client={data.client} formResult={form} submitLabel="Save Changes" />
		</CardContent>
	</Card>

	<Card class="max-w-2xl border-destructive/30">
		<CardHeader>
			<CardTitle class="text-destructive">Danger Zone</CardTitle>
			<CardDescription>Permanently delete this client and all associated data.</CardDescription>
		</CardHeader>
		<CardContent>
			<Button variant="outline" class="border-destructive/50 text-destructive hover:bg-destructive/10" onclick={() => (deleteOpen = true)}>
				<Trash2 class="mr-2 h-4 w-4" />
				Delete Client
			</Button>
		</CardContent>
	</Card>
</div>

<AlertDialog.Root bind:open={deleteOpen}>
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
				action="/clients/{data.client.id}?/deleteClient"
				use:enhance={() => {
					deleteLoading = true;
					return async ({ result, update }) => {
						deleteLoading = false;
						if (result.type === 'redirect') {
							toast.success('Client deleted');
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="confirm" value="yes" />
				<AlertDialog.Action type="submit" variant="destructive" disabled={deleteLoading}>
					{deleteLoading ? 'Deleting...' : 'Delete Client'}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
