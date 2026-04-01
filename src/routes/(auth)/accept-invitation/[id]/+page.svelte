<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
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

<div class="flex min-h-screen items-center justify-center bg-background">
	<Card class="max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Organization Invitation</CardTitle>
			<CardDescription>You've been invited to join an organization.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if form?.error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">
					Would you like to accept this invitation?
				</p>
			{/if}
		</CardContent>
		<CardFooter class="flex gap-2">
			<form
				method="POST"
				action="?/accept"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
				class="flex-1"
			>
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Accepting...' : 'Accept invitation'}
				</Button>
			</form>
			<form method="POST" action="?/reject" use:enhance class="flex-1">
				<Button type="submit" variant="outline" class="w-full">Decline</Button>
			</form>
		</CardFooter>
	</Card>
</div>
