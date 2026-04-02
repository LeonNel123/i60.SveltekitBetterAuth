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
	import { APP_NAME } from '$lib/config';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Profile — {APP_NAME}</title>
</svelte:head>

<Card class="max-w-lg">
	<CardHeader>
		<CardTitle>Profile</CardTitle>
		<CardDescription>Manage your personal information.</CardDescription>
	</CardHeader>
	<CardContent>
		<form method="POST" use:enhance class="space-y-4">
			{#if form?.error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="rounded-md bg-primary/10 p-3 text-sm text-primary">Profile updated.</div>
			{/if}
			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input id="name" name="name" value={data.user.name} required />
			</div>
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" value={data.user.email} disabled />
				<p class="text-xs text-muted-foreground">Email cannot be changed.</p>
			</div>
			<Button type="submit" class="w-fit">Save changes</Button>
		</form>
	</CardContent>
</Card>
