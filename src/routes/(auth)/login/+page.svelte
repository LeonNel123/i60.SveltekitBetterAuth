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

	let { form } = $props();
	let submitting = $state(false);
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">Sign in</CardTitle>
		<CardDescription>Enter your credentials to access your account</CardDescription>
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
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="you@example.com"
					value={form?.email ?? ''}
					required
				/>
			</div>
			<div class="grid gap-2">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>
					<a href="/forgot-password" class="text-sm text-muted-foreground hover:underline">
						Forgot password?
					</a>
				</div>
				<Input id="password" name="password" type="password" required />
			</div>
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Signing in...' : 'Sign in'}
			</Button>
		</form>
	</CardContent>
	<CardFooter class="justify-center">
		<p class="text-sm text-muted-foreground">
			Don't have an account?
			<a href="/register" class="text-primary hover:underline">Sign up</a>
		</p>
	</CardFooter>
</Card>
