<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data, form } = $props();
</script>

<Card class="max-w-lg">
	<CardHeader>
		<CardTitle>Profile</CardTitle>
		<CardDescription>Update your display name.</CardDescription>
	</CardHeader>
	<CardContent>
		<form method="POST" use:enhance class="space-y-4">
			{#if form?.error}
				<p class="text-sm text-destructive">{form.error}</p>
			{/if}
			{#if form?.success}
				<p class="text-sm text-green-600">Profile updated successfully.</p>
			{/if}

			<div class="space-y-2">
				<label for="name" class="text-sm font-medium">Name</label>
				<input
					id="name"
					name="name"
					type="text"
					value={data.user.name}
					required
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				/>
			</div>

			<div class="space-y-2">
				<label for="email" class="text-sm font-medium">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					value={data.user.email}
					disabled
					class="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground shadow-sm"
				/>
			</div>

			<Button type="submit">Save changes</Button>
		</form>
	</CardContent>
</Card>
