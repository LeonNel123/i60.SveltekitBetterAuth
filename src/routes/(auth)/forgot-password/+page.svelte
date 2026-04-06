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

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Reset password — {APP_NAME}</title>
</svelte:head>

<Card class="rounded-xl">
	<CardHeader>
		<CardTitle class="text-2xl">Reset password</CardTitle>
		<CardDescription>Enter your email to receive a reset link</CardDescription>
	</CardHeader>
	<CardContent>
		{#if form?.success}
			<div class="rounded-md bg-primary/10 p-4 text-sm text-primary">
				If an account exists for {form.email}, you'll receive a password reset link.
			</div>
		{:else}
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
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
					/>
				</div>
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Sending...' : 'Send reset link'}
				</Button>
			</form>
		{/if}
	</CardContent>
	<CardFooter class="justify-center">
		<p class="text-sm text-muted-foreground">
			<a href="/login" class="text-primary hover:underline">Back to sign in</a>
		</p>
	</CardFooter>
</Card>
