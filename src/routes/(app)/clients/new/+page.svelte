<script lang="ts">
	import { APP_NAME } from '$lib/config';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import ClientForm from '$lib/components/clients/client-form.svelte';
	import PageHeader from '$lib/components/shared/page-header.svelte';
	import OrgGuard from '$lib/components/shared/org-guard.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>New Client — {APP_NAME}</title>
</svelte:head>

<OrgGuard>
	<div class="space-y-6">
		<PageHeader title="New Client" description="Add a new insured client to your organisation." />
		<Card class="max-w-2xl">
			<CardHeader>
				<CardTitle>Client Details</CardTitle>
				<CardDescription>Enter the client's information below.</CardDescription>
			</CardHeader>
			<CardContent>
				<ClientForm formResult={form} submitLabel="Create Client" />
			</CardContent>
		</Card>
	</div>
</OrgGuard>
