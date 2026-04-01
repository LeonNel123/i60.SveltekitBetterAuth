<script lang="ts">
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

	let email = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleReset(e: Event) {
		e.preventDefault();
		loading = true;
		// TODO: Wire up auth.api.forgetPassword() when email provider is configured
		await new Promise((r) => setTimeout(r, 500));
		success = true;
		loading = false;
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Reset password</CardTitle>
		<CardDescription>Enter your email to receive a reset link</CardDescription>
	</CardHeader>
	<CardContent>
		{#if success}
			<div class="rounded-md bg-primary/10 p-4 text-sm text-primary">
				If an account exists for {email}, you'll receive a password reset link.
			</div>
		{:else}
			<form onsubmit={handleReset} class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						bind:value={email}
						required
					/>
				</div>
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Sending...' : 'Send reset link'}
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
