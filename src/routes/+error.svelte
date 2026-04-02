<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { APP_NAME } from '$lib/config';
</script>

<svelte:head>
	<title>Error {page.status} — {APP_NAME}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background">
	<Card class="max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">{page.status}</CardTitle>
			<CardDescription>
				{#if page.status === 404}
					The page you're looking for doesn't exist.
				{:else}
					Something went wrong. Please try again.
				{/if}
			</CardDescription>
		</CardHeader>
		<CardContent class="flex gap-2">
			<Button href="/" variant="outline">Go home</Button>
			<Button href="/dashboard">Dashboard</Button>
		</CardContent>
	</Card>
</div>
