<script lang="ts">
	import { enhance } from '$app/forms';
	import { authClient } from '$lib/auth-client';
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
	import type { PageProps } from './$types';

	let { form, data }: PageProps = $props();
	let submitting = $state(false);
	let socialLoading = $state('');

	async function socialSignIn(provider: 'google' | 'github' | 'microsoft') {
		socialLoading = provider;
		await authClient.signIn.social({ provider, callbackURL: '/dashboard' });
		socialLoading = '';
	}
</script>

<svelte:head>
	<title>Create account — {APP_NAME}</title>
</svelte:head>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Create account</CardTitle>
		<CardDescription>Enter your details to get started</CardDescription>
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
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{/if}
			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input
					id="name"
					name="name"
					type="text"
					autocomplete="name"
					placeholder="Your name"
					value={form?.name ?? ''}
					required
				/>
			</div>
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					placeholder="you@example.com"
					value={form?.email ?? ''}
					required
				/>
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					placeholder="Min 8 characters"
					required
					minlength={8}
				/>
			</div>
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Creating account...' : 'Create account'}
			</Button>
		</form>
		{#if data.hasGoogle || data.hasGithub || data.hasMicrosoft}
			<div class="relative my-4">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t"></span>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-card px-2 text-muted-foreground">Or continue with</span>
				</div>
			</div>
			<div class="grid gap-2">
				{#if data.hasGoogle}
					<Button
						variant="outline"
						class="w-full"
						onclick={() => socialSignIn('google')}
						disabled={!!socialLoading}
					>
						{socialLoading === 'google' ? 'Redirecting...' : 'Google'}
					</Button>
				{/if}
				{#if data.hasGithub}
					<Button
						variant="outline"
						class="w-full"
						onclick={() => socialSignIn('github')}
						disabled={!!socialLoading}
					>
						{socialLoading === 'github' ? 'Redirecting...' : 'GitHub'}
					</Button>
				{/if}
				{#if data.hasMicrosoft}
					<Button
						variant="outline"
						class="w-full"
						onclick={() => socialSignIn('microsoft')}
						disabled={!!socialLoading}
					>
						{socialLoading === 'microsoft' ? 'Redirecting...' : 'Microsoft'}
					</Button>
				{/if}
			</div>
		{/if}
	</CardContent>
	<CardFooter class="justify-center">
		<p class="text-sm text-muted-foreground">
			Already have an account?
			<a href="/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</CardFooter>
</Card>
