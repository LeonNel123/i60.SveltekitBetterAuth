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
				<Input id="name" name="name" type="text" placeholder="Your name" value={form?.name ?? ''} required />
			</div>
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
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder="Min 8 characters"
					required
					minlength={8}
				/>
			</div>
			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Creating account...' : 'Create account'}
			</Button>
		</form>
	</CardContent>
	<CardFooter class="justify-center">
		<p class="text-sm text-muted-foreground">
			Already have an account?
			<a href="/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</CardFooter>
</Card>
