<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';
	import { APP_NAME } from '$lib/config';
	import { AlertCircle } from 'lucide-svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Set new password — {APP_NAME}</title>
</svelte:head>

<Card class="rounded-xl">
	<CardHeader>
		<CardTitle class="text-2xl">Set new password</CardTitle>
		<CardDescription>Enter your new password below</CardDescription>
	</CardHeader>
	<CardContent>
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
			class="grid gap-4"
		>
			{#if form?.error}
				<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{form.error}</span>
				</div>
			{/if}
			<input type="hidden" name="token" value={data.token} />
			<div class="grid gap-2">
				<Label for="newPassword">New password</Label>
				<Input
					id="newPassword"
					name="newPassword"
					type="password"
					autocomplete="new-password"
					placeholder="Min 8 characters"
					required
					minlength={8}
				/>
			</div>
			<div class="grid gap-2">
				<Label for="confirmPassword">Confirm password</Label>
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					placeholder="Re-enter your password"
					required
					minlength={8}
				/>
			</div>
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Resetting...' : 'Reset password'}
			</Button>
		</form>
	</CardContent>
	<CardFooter class="flex-col gap-2">
		<a href="/forgot-password" class="text-sm text-muted-foreground hover:underline">
			Request a new reset link
		</a>
		<a href="/login" class="text-sm text-muted-foreground hover:underline">Back to sign in</a>
	</CardFooter>
</Card>
