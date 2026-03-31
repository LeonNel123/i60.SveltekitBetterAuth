<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		const { error: authError } = await authClient.signUp.email({
			name,
			email,
			password
		});
		if (authError) {
			error = authError.message ?? 'Failed to create account';
			loading = false;
		} else {
			goto('/dashboard');
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="text-2xl">Create account</Card.Title>
		<Card.Description>Enter your details to get started</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleRegister} class="grid gap-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			{/if}
			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input id="name" type="text" placeholder="Your name" bind:value={name} required />
			</div>
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" placeholder="you@example.com" bind:value={email} required />
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input id="password" type="password" placeholder="Min 8 characters" bind:value={password} required minlength={8} />
			</div>
			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Creating account...' : 'Create account'}
			</Button>
		</form>
	</Card.Content>
	<Card.Footer class="justify-center">
		<p class="text-sm text-muted-foreground">
			Already have an account? <a href="/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</Card.Footer>
</Card.Root>
