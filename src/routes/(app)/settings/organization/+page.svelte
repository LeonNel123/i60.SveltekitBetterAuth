<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

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

{#if data.organization}
	<Card class="max-w-lg">
		<CardHeader>
			<CardTitle>Organization</CardTitle>
			<CardDescription>Your current organization details.</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="space-y-2">
				<label for="org-name" class="text-sm font-medium">Name</label>
				<input
					id="org-name"
					type="text"
					value={data.organization.name}
					disabled
					class="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground shadow-sm"
				/>
			</div>
			<div class="space-y-2">
				<label for="org-slug" class="text-sm font-medium">Slug</label>
				<input
					id="org-slug"
					type="text"
					value={data.organization.slug}
					disabled
					class="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground shadow-sm"
				/>
			</div>
		</CardContent>
	</Card>
{:else}
	<Card class="max-w-lg">
		<CardHeader>
			<CardTitle>Create Organization</CardTitle>
			<CardDescription>You don't have an organization yet. Create one to get started.</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleCreate} class="space-y-4">
				{#if createError}
					<p class="text-sm text-destructive">{createError}</p>
				{/if}

				<div class="space-y-2">
					<label for="new-org-name" class="text-sm font-medium">Organization name</label>
					<input
						id="new-org-name"
						type="text"
						bind:value={orgName}
						required
						placeholder="My Organization"
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>

				<div class="space-y-2">
					<label for="new-org-slug" class="text-sm font-medium">Slug <span class="text-muted-foreground">(optional)</span></label>
					<input
						id="new-org-slug"
						type="text"
						bind:value={orgSlug}
						placeholder="my-organization"
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>

				<Button type="submit" disabled={creating}>
					{creating ? 'Creating…' : 'Create organization'}
				</Button>
			</form>
		</CardContent>
	</Card>
{/if}
