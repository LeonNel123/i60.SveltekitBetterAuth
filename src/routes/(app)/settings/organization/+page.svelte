<script lang="ts">
	import { enhance } from '$app/forms';
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
	import { AlertCircle } from 'lucide-svelte';
	import { APP_NAME } from '$lib/config';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let creating = $state(false);

	function getCreateFormValues(currentForm: PageProps['form']) {
		if (
			currentForm &&
			'values' in currentForm &&
			currentForm.values &&
			typeof currentForm.values === 'object'
		) {
			return currentForm.values as { name?: string; slug?: string };
		}

		return {};
	}
</script>

<svelte:head>
	<title>Organization — {APP_NAME}</title>
</svelte:head>

{#if data.organization}
	<Card class="max-w-lg rounded-xl">
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
{:else if data.organizations.length > 0}
	<Card class="max-w-2xl rounded-xl">
		<CardHeader>
			<CardTitle>Restore Organization Access</CardTitle>
			<CardDescription>
				Your account already belongs to an organization, but this session does not have an active
				organization selected yet.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if form?.activateError}
				<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{form.activateError}</span>
				</div>
			{/if}

			<div class="space-y-3">
				{#each data.organizations as organization (organization.id)}
					<form
						method="POST"
						action="?/activate"
						class="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="space-y-1">
							<p class="font-medium">{organization.name}</p>
							<p class="text-muted-foreground text-sm">/{organization.slug}</p>
						</div>
						<input type="hidden" name="organizationId" value={organization.id} />
						<Button type="submit" variant="outline">Use organization</Button>
					</form>
				{/each}
			</div>

			<p class="text-muted-foreground text-sm">
				If the organization you expect is not listed here, the organization row exists without a
				matching membership and needs a one-time production repair.
			</p>
		</CardContent>
	</Card>
{:else}
	<Card class="max-w-lg rounded-xl">
		<CardHeader>
			<CardTitle>Create Organization</CardTitle>
			<CardDescription
				>You don't have an organization yet. Create one to get started.</CardDescription
			>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				action="?/create"
				class="space-y-4"
				use:enhance={() => {
					creating = true;
					return async ({ update }) => {
						await update();
						creating = false;
					};
				}}
			>
				{#if form?.createError}
					<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
						<span>{form.createError}</span>
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="new-org-name">Organization name <span class="text-destructive">*</span></Label>
					<Input
						id="new-org-name"
						name="name"
						value={getCreateFormValues(form).name ?? ''}
						required
						placeholder="My Organization"
					/>
				</div>
				<div class="grid gap-2">
					<Label for="new-org-slug"
						>Slug <span class="text-muted-foreground">(optional)</span></Label
					>
					<Input
						id="new-org-slug"
						name="slug"
						value={getCreateFormValues(form).slug ?? ''}
						placeholder="my-organization"
					/>
				</div>
				<Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create organization'}</Button>
			</form>
		</CardContent>
	</Card>
{/if}
