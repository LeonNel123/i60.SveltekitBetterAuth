<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { APP_NAME } from '$lib/config';
	import Home from '@lucide/svelte/icons/home';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Users from '@lucide/svelte/icons/users';
</script>

<svelte:head>
	<title>Error {page.status} — {APP_NAME}</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
	<p class="text-sm font-medium tracking-widest text-muted-foreground uppercase">{APP_NAME}</p>
	<h1 class="mt-4 text-7xl font-bold tracking-tight text-foreground">{page.status}</h1>
	<p class="mt-4 max-w-md text-lg text-muted-foreground">
		{#if page.error?.message}
			{page.error.message}
		{:else if page.status === 404}
			The page you're looking for doesn't exist or has been moved.
		{:else if page.status === 403}
			You don't have permission to access this page.
		{:else if page.status === 500}
			Something went wrong on our end. Please try again later.
		{:else}
			An unexpected error occurred.
		{/if}
	</p>
	<div class="mt-8 flex flex-wrap justify-center gap-3">
		<Button href="/dashboard" variant="default">
			<LayoutDashboard class="mr-2 h-4 w-4" />
			Go to Dashboard
		</Button>
		<Button href="/clients" variant="outline">
			<Users class="mr-2 h-4 w-4" />
			Go to Clients
		</Button>
		<Button href="/" variant="outline">
			<Home class="mr-2 h-4 w-4" />
			Go Home
		</Button>
	</div>
</div>
