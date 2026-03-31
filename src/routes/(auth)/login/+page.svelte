<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		const { error: authError } = await authClient.signIn.email({
			email,
			password
		});
		if (authError) {
			error = authError.message ?? 'Failed to sign in';
			loading = false;
		} else {
			goto('/dashboard');
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="text-2xl">Sign in</Card.Title>
		<Card.Description>Enter your credentials to access your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleLogin} class="grid gap-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			{/if}
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" placeholder="you@example.com" bind:value={email} required />
			</div>
			<div class="grid gap-2">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>
					<a href="/forgot-password" class="text-sm text-muted-foreground hover:underline">
						Forgot password?
					</a>
				</div>
				<Input id="password" type="password" bind:value={password} required />
			</div>
			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Signing in...' : 'Sign in'}
			</Button>
		</form>
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			Don't have an account? <a href="/register" class="text-primary hover:underline">Sign up</a>
		</p>
	</Card.Footer>
</Card.Root>
