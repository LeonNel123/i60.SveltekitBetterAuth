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
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import { APP_NAME } from '$lib/config';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let saving = $state(false);
</script>

<svelte:head>
	<title>Profile — {APP_NAME}</title>
</svelte:head>

<Card class="max-w-lg rounded-xl">
	<CardHeader>
		<CardTitle>Profile</CardTitle>
		<CardDescription>Manage your display name and personal details.</CardDescription>
	</CardHeader>
	<CardContent>
		<form
			method="POST"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update();
					saving = false;
				};
			}}
			class="space-y-4"
		>
			{#if form?.error}
				<div
					class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{form.error}</span>
				</div>
			{/if}
			{#if form?.success}
				<div class="rounded-md bg-primary/10 p-3 text-sm text-primary">Profile updated.</div>
			{/if}
			<div class="grid gap-2">
				<Label for="name">Name <span class="text-destructive">*</span></Label>
				<Input id="name" name="name" value={data.user.name} required />
			</div>
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" value={data.user.email} disabled />
				<p class="text-xs text-muted-foreground">Email cannot be changed.</p>
			</div>
			<Button type="submit" class="w-fit" disabled={saving}
				>{saving ? 'Saving...' : 'Save changes'}</Button
			>
		</form>
	</CardContent>
</Card>
