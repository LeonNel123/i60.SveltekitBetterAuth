<script lang="ts">
	import { APP_NAME } from '$lib/config';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import ClientForm from '$lib/components/clients/client-form.svelte';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
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
</div>
