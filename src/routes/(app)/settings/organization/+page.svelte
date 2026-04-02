<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { APP_NAME } from '$lib/config';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let orgName = $state('');
	let orgSlug = $state('');
	let creating = $state(false);
	let createError = $state('');

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		if (!orgName.trim()) return;
		creating = true;
		createError = '';
		const result = await authClient.organization.create({
			name: orgName.trim(),
			slug: orgSlug.trim() || orgName.trim().toLowerCase().replace(/\s+/g, '-')
		});
		creating = false;
		if (result.error) {
			createError = result.error.message ?? 'Failed to create organization';
		} else {
			await invalidateAll();
		}
	}
</script>

<svelte:head>
	<title>Organization — {APP_NAME}</title>
</svelte:head>

{#if data.organization}
	<Card class="max-w-lg">
		<CardHeader>
			<CardTitle>Organization</CardTitle>
			<CardDescription>Your current organization details.</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="grid gap-2">
				<Label for="org-name">Name</Label>
				<Input id="org-name" value={data.organization.name} disabled />
			</div>
			<div class="grid gap-2">
				<Label for="org-slug">Slug</Label>
				<Input id="org-slug" value={data.organization.slug} disabled />
			</div>
		</CardContent>
	</Card>
{:else}
	<Card class="max-w-lg">
		<CardHeader>
			<CardTitle>Create Organization</CardTitle>
			<CardDescription
				>You don't have an organization yet. Create one to get started.</CardDescription
			>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleCreate} class="space-y-4">
				{#if createError}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{createError}
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="new-org-name">Organization name</Label>
					<Input id="new-org-name" bind:value={orgName} required placeholder="My Organization" />
				</div>
				<div class="grid gap-2">
					<Label for="new-org-slug"
						>Slug <span class="text-muted-foreground">(optional)</span></Label
					>
					<Input id="new-org-slug" bind:value={orgSlug} placeholder="my-organization" />
				</div>
				<Button type="submit" disabled={creating}>
					{creating ? 'Creating…' : 'Create organization'}
				</Button>
			</form>
		</CardContent>
	</Card>
{/if}
